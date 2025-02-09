import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { contactService } from './contactService';

// Define the schema for our command output
const CommandSchema = z.object({
  action: z.enum(['create', 'list', 'delete', 'update', 'unknown', 'create_ask_name', 'create_with_name']),
  contact: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  contactId: z.number().optional(),
  confidence: z.number().min(0).max(1),
  responseMessage: z.string().optional(),
});

type CommandOutput = z.infer<typeof CommandSchema>;

export class ContactManagementAgent {
  private model: ChatAnthropic;
  private parser: StructuredOutputParser<typeof CommandSchema>;
  private prompt: ChatPromptTemplate;
  private pendingAction: string | null = null;

  constructor(apiKey: string) {
    this.model = new ChatAnthropic({
      anthropicApiKey: apiKey,
      modelName: 'claude-3-opus-20240229',
    });

    this.parser = StructuredOutputParser.fromZodSchema(CommandSchema);

    const formatInstructions = this.parser.getFormatInstructions().replace(/[{}]/g, (match) => `${match}${match}`);

    this.prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are a helpful assistant that manages contacts in a system. 
You handle multi-turn conversations to gather contact information.

When a user wants to create a contact:
1. If they just say "add contact" or similar, ask for the name first (action: create_ask_name)
2. If they provide a name, extract it and proceed with creation (action: create_with_name)
3. If they provide other details like email/phone along with name, use those too

${formatInstructions}

Examples:
"Add contact" -> {{"action": "create_ask_name", "confidence": 0.9, "responseMessage": "I can help you create a new contact. What is their name?"}}
"John Smith" -> {{"action": "create_with_name", "contact": {{"firstName": "John", "lastName": "Smith"}}, "confidence": 0.9, "responseMessage": "I'll create a contact for John Smith. Would you like to add an email or phone number?"}}
"Add John Smith with email john@example.com" -> {{"action": "create", "contact": {{"firstName": "John", "lastName": "Smith", "email": "john@example.com"}}, "confidence": 0.9}}
"Show all contacts" -> {{"action": "list", "confidence": 0.95}}
"Remove contact with ID 5" -> {{"action": "delete", "contactId": 5, "confidence": 0.85}}
"Hello" -> {{"action": "unknown", "confidence": 0.7, "responseMessage": "Hi! I can help you manage your contacts. You can ask me to add, list, or update contacts."}}

Always try to extract the full details when relevant and set an appropriate confidence score.`],
      ['user', '{input}'],
    ]);
  }

  async processCommand(command: string) {
    try {
      const chain = this.prompt.pipe(this.model).pipe(this.parser);
      
      const result = await chain.invoke({
        input: command,
      });

      console.log('🤖 LangChain parsed command:', result);

      // If confidence is too low, treat as unknown
      if (result.confidence < 0.6) {
        return {
          success: false,
          message: "I'm not very confident about what you want to do. Could you please rephrase your request?"
        };
      }

      switch (result.action) {
        case 'create_ask_name':
          this.pendingAction = 'waiting_for_name';
          return {
            success: true,
            message: result.responseMessage || "What is the name of the contact you'd like to create?"
          };

        case 'create_with_name':
          if (!result.contact?.firstName) {
            return {
              success: false,
              message: "I couldn't understand the name. Could you please provide it again?"
            };
          }
          const contact = await contactService.createContact({
            firstName: result.contact.firstName,
            lastName: result.contact.lastName || '',
            email: result.contact.email,
            phone: result.contact.phone,
            notes: result.contact.notes
          });
          return {
            success: true,
            message: `I've created a contact for ${contact.firstName} ${contact.lastName}. Would you like to add any additional details like email or phone number?`,
            data: contact
          };

        case 'create':
          if (!result.contact?.firstName || !result.contact?.lastName) {
            return {
              success: false,
              message: "I couldn't understand the contact details. Please provide at least a first and last name."
            };
          }
          console.log('👤 Creating contact:', result.contact);
          const createResult = await contactService.createContact({
            firstName: result.contact.firstName,
            lastName: result.contact.lastName,
            email: result.contact.email,
            phone: result.contact.phone,
            notes: result.contact.notes
          });
          return {
            success: true,
            message: `Created contact: ${createResult.firstName} ${createResult.lastName}${result.contact.email ? ` with email ${result.contact.email}` : ''}${result.contact.phone ? ` and phone ${result.contact.phone}` : ''}`,
            data: createResult
          };

        case 'list':
          console.log('📋 Listing contacts');
          const contacts = await contactService.getContacts();
          const contactList = contacts
            .map(contact => `- ${contact.firstName} ${contact.lastName}${contact.email ? ` (${contact.email})` : ''}`)
            .join('\n');
          return {
            success: true,
            message: contacts.length > 0 ? `Here are your contacts:\n${contactList}` : "You don't have any contacts yet.",
            data: contacts
          };

        case 'delete':
          if (!result.contactId) {
            return {
              success: false,
              message: "I couldn't understand which contact to delete. Please provide the contact ID."
            };
          }
          console.log('🗑️ Deleting contact:', result.contactId);
          await contactService.deleteContact(result.contactId);
          return {
            success: true,
            message: `Contact deleted successfully.`
          };

        case 'update':
          if (!result.contactId || !result.contact) {
            return {
              success: false,
              message: "I couldn't understand the update details. Please provide the contact ID and what to update."
            };
          }
          console.log('✏️ Updating contact:', result.contactId, result.contact);
          const updateResult = await contactService.updateContact(result.contactId, result.contact);
          return {
            success: true,
            message: `Updated contact: ${updateResult.firstName} ${updateResult.lastName}`,
            data: updateResult
          };

        default:
          return {
            success: false,
            message: result.responseMessage || "I'm not sure what you want me to do. You can try:\n" +
                    "- Creating a new contact\n" +
                    "- Listing all your contacts\n" +
                    "- Updating a contact\n" +
                    "- Deleting a contact"
          };
      }
    } catch (error) {
      console.error('Error processing command:', error);
      return {
        success: false,
        message: "Sorry, I encountered an error processing your request. Please try again."
      };
    }
  }
}