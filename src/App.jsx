import { useEffect, useMemo, useRef, useState } from 'react';

const initialMessages = [
  {
    role: 'assistant',
    content: 'Hello! I am My Future. I can chat with you, listen to your voice, and understand images you upload.',
  },
];

function App() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const assistantMessage = useMemo(
    () => messages.filter((item) => item.role === 'assistant').at(-1)?.content || '',
    [messages]
  );

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(file);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSpeak = () => {
    if (!assistantMessage) return;
    const utterance = new SpeechSynthesisUtterance(assistantMessage);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    recognitionRef.current.start();
    setIsListening(true);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !selectedImage) return;

    const userMessage = {
      role: 'user',
      content: trimmed || 'Please analyze this image.',
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        messages: nextMessages,
        message: trimmed || 'Please analyze this image.',
      };

      if (imagePreview) {
        payload.imageBase64 = imagePreview.split(',')[1];
        payload.imageType = selectedImage?.type || 'image/png';
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const assistantReply = data.reply || 'I did not receive a response.';

      setMessages((current) => [...current, { role: 'assistant', content: assistantReply }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Something went wrong while contacting the AI service.' },
      ]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
      setImagePreview('');
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">My Future</div>
        <ul>
          <li>Text chat</li>
          <li>Voice input</li>
          <li>Image analysis</li>
          <li>Text-to-speech</li>
        </ul>
      </aside>

      <main className="chat-panel">
        <header className="chat-header">
          <div>
            <h1>My Future AI</h1>
            <p>Talk, listen, or upload an image</p>
          </div>
          <button className="secondary" onClick={handleSpeak} disabled={!assistantMessage}>
            Speak reply
          </button>
        </header>

        <div className="messages">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
              <span>{message.role === 'assistant' ? 'AI' : 'You'}</span>
              <p>{message.content}</p>
            </div>
          ))}

          {isLoading && <div className="message assistant loading"><span>AI</span><p>Thinking...</p></div>}
          <div ref={messagesEndRef} />
        </div>

        {imagePreview && (
          <div className="image-preview-box">
            <img src={imagePreview} alt="Selected upload" />
            <button className="ghost" onClick={() => setImagePreview('')}>
              Remove image
            </button>
          </div>
        )}

        <div className="composer">
          <label className="upload-btn">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            Upload image
          </label>

          <button className={`mic ${isListening ? 'active' : ''}`} onClick={toggleListening}>
            {isListening ? 'Stop recording' : 'Use mic'}
          </button>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your message here..."
            rows={3}
          />

          <button className="primary" onClick={handleSend} disabled={isLoading || (!input.trim() && !imagePreview)}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
