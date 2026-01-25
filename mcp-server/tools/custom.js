/**
 * Custom request tools
 * Handles commission inquiries and contact information
 */

import { z } from 'zod'
import { config } from '../config.js'

const CommissionInquirySchema = z.object({
  subject: z.string().min(1).describe('Brief description of the commission'),
  details: z.string().min(10).describe('Detailed description of what you want commissioned'),
  budget: z
    .string()
    .optional()
    .describe('Budget range if known (e.g., "$500-$1000")'),
  deadline: z
    .string()
    .optional()
    .describe('Desired completion date if any'),
  contactInfo: z
    .string()
    .optional()
    .describe('Your name and email if you want a response'),
})

const NoArgsSchema = z.object({})

/**
 * Register custom request tools with MCP server
 */
export function registerCustomTools(server, dataStore) {
  // Tool 11: Submit commission inquiry
  server.tool(
    'submit_commission_inquiry',
    'Submit a custom commission request',
    CommissionInquirySchema,
    async (inquiry) => {
      try {
        const saved = await dataStore.addInquiry({
          type: 'commission',
          ...inquiry,
          submittedAt: new Date().toISOString(),
        })

        return {
          content: [
            {
              type: 'text',
              text: formatCommissionConfirmation(saved),
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error submitting inquiry: ${error.message}`,
            },
          ],
        }
      }
    }
  )

  // Tool 12: Get contact info
  server.tool(
    'get_contact_info',
    'Get artist contact information',
    NoArgsSchema,
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: formatContactInfo(),
          },
        ],
      }
    }
  )
}

/**
 * Format commission submission confirmation
 */
function formatCommissionConfirmation(inquiry) {
  return `✅ Commission Inquiry Submitted

Inquiry ID: ${inquiry.id}
Submitted: ${new Date(inquiry.submittedAt).toLocaleString()}

Subject: ${inquiry.subject}
Details: ${inquiry.details}
${inquiry.budget ? `Budget: ${inquiry.budget}` : ''}
${inquiry.deadline ? `Deadline: ${inquiry.deadline}` : ''}

Response:
Kristian typically responds to commission inquiries within ${config.store.responseTimeHours} hours.
${inquiry.contactInfo ? `Contact info on file: ${inquiry.contactInfo}` : 'Please include your email if you want a response.'}

Next Steps:
1. Kristian will review your inquiry
2. She will contact you to discuss details
3. You'll receive a custom quote and timeline`
}

/**
 * Format contact information
 */
function formatContactInfo() {
  return `📧 Contact Information

Email: ${config.store.email}
Website: https://${config.store.domain}

Response Time: Within ${config.store.responseTimeHours} hours

Social Media:
• Instagram: @kristiantalley (typically has links to latest work)
• Portfolio: https://kristiantalley.com

For Inquiries:
✉️  Commission Work: Use submit_commission_inquiry tool
📧 General Questions: Email ${config.store.email}
🛍️  Purchase Support: Check order confirmation email

Available for:
• Custom pen and ink commissions
• Illustration work
• Print requests
• Licensing inquiries

Commission Process:
1. Submit inquiry with details and budget
2. Artist responds with availability and pricing
3. Discuss design and timeline
4. 50% deposit required to start
5. Completion with remaining balance due before delivery`
}
