import { useState } from 'react'

/**
 * Contact page - minimal form matching KTT style
 */
function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log('Form submitted:', formData)
      setSubmitted(true)
    } catch (error) {
      console.error('Error:', error)
      alert('Error sending message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="p-6 max-w-xl">
        <h1 className="text-xl font-normal mb-4">Message Sent</h1>
        <p className="text-sm text-gray-600 mb-6">
          Thanks for reaching out. I'll get back to you soon.
        </p>
        <button
          onClick={() => {
            setSubmitted(false)
            setFormData({ name: '', email: '', subject: '', message: '' })
          }}
          className="btn"
        >
          Send Another
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-normal mb-2">Contact</h1>
      <p className="text-sm text-gray-600 mb-8">
        Questions, commissions, or just want to say hello.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="input"
            placeholder="Optional"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="input resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn"
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </form>

      <div className="separator" />

      <div className="text-sm">
        <span className="text-xs uppercase tracking-wider text-gray-500 block mb-1">
          Or email directly
        </span>
        <a
          href="mailto:talleykristian@gmail.com"
          className="hover:text-gray-500"
        >
          talleykristian@gmail.com
        </a>
      </div>
    </div>
  )
}

export default ContactPage
