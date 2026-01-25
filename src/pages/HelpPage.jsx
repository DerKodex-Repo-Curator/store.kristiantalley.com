import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { chat, SUGGESTED_QUESTIONS } from '../lib/supportBot'

/**
 * Help/FAQ page with embedded chat - full page support experience
 */
function HelpPage() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Send message
  const handleSend = async (messageText = inputValue) => {
    const text = messageText.trim()
    if (!text || isLoading) return

    const userMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await chat(text, messages)
      const botMessage = { role: 'assistant', content: response }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again or email talleykristian@gmail.com.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // FAQ items
  const faqs = [
    {
      question: 'What types of artwork do you sell?',
      answer: 'I sell original pen and ink drawings, mixed media illustrations, and limited edition giclée prints. Each original is one-of-a-kind, created by hand.',
    },
    {
      question: 'How much does shipping cost?',
      answer: 'Shipping is free on orders over $200. All orders include tracking. US domestic shipping typically takes 5-7 business days. International orders take 2-3 weeks.',
    },
    {
      question: 'Do you accept returns?',
      answer: 'Returns are accepted within 14 days if artwork arrives damaged. Please email talleykristian@gmail.com with photos of any damage to initiate a return.',
    },
    {
      question: 'Do you take commissions?',
      answer: 'Yes, custom commissions are available. Please email talleykristian@gmail.com to discuss your project. Typical turnaround is 4-8 weeks depending on complexity.',
    },
    {
      question: 'How should I care for my artwork?',
      answer: 'Keep artwork away from direct sunlight to prevent fading. Frame under glass or acrylic for protection. Handle prints by the edges only to avoid fingerprints.',
    },
    {
      question: 'Do originals come with a certificate?',
      answer: 'Yes, all original artwork includes a signed certificate of authenticity.',
    },
  ]

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-normal mb-2">Help & FAQ</h1>
      <p className="text-sm text-gray-600 mb-8">
        Find answers to common questions or chat with our AI assistant.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* FAQ Section */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-normal mb-2">{faq.question}</h3>
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-sm text-gray-600">
              Can't find what you're looking for?{' '}
              <Link to="/contact" className="underline hover:text-black">
                Contact me
              </Link>{' '}
              or use the chat assistant.
            </p>
          </div>
        </div>

        {/* Chat Section */}
        <div>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-4">
            Ask a Question
          </h2>

          <div className="border border-gray-200">
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Ask me anything about artwork, shipping, commissions, or the artist.
                  </p>
                  <div className="space-y-2">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        onClick={() => handleSend(question)}
                        className="block w-full text-left text-xs text-gray-600 hover:text-black py-2 px-3 border border-gray-200 bg-white hover:border-gray-400 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] text-sm px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-black text-white'
                          : 'bg-white text-black border border-gray-200'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-black text-sm px-3 py-2 border border-gray-200">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3 bg-white">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  disabled={isLoading}
                  className="flex-1 text-sm px-3 py-2 border border-gray-200 focus:outline-none focus:border-black transition-colors disabled:bg-gray-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !inputValue.trim()}
                  className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            AI-powered support. For complex inquiries, email{' '}
            <a href="mailto:talleykristian@gmail.com" className="underline">
              talleykristian@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default HelpPage
