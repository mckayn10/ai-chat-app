import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { contactService } from './contactService';

// Define the schema for our command output
const CommandSchema = z.object({
  action: z.enum(['create', 'list', 'delete', 'update', 'unknown', 'create_ask_name', 'create_with_name', 'update_by_name']),
  contact: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
    targetFirstName: z.string().optional(),
    targetLastName: z.string().optional(),
    updates: z.object({
      email: z.string().optional(),
      phone: z.string().optional(),
      notes: z.string().optional(),
    }).optional(),
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

    const formatInstructions = this.parser.getFormatInstructions();

    const PROMPT_TEMPLATE = `You are a bilingual (English/Spanish) contact management assistant. Your task is to interpret user commands in either English or Spanish and output a structured JSON response. You MUST include a responseMessage in the same language as the user's input.

Here are some example commands and their expected outputs:

English examples:
User: "Show all my contacts"
{{
  "action": "list",
  "confidence": 0.9,
  "responseMessage": "Here are your contacts:"
}}

User: "Create a new contact for John Smith"
{{
  "action": "create_ask_name",
  "confidence": 0.9,
  "contact": {{
    "firstName": "John",
    "lastName": "Smith"
  }},
  "responseMessage": "What additional information would you like to add for John?"
}}

Spanish examples:
User: "Quiero ver todos mis contactos"
{{
  "action": "list",
  "confidence": 0.9,
  "responseMessage": "Aquí están tus contactos:"
}}

User: "Mostrar mis contactos"
{{
  "action": "list",
  "confidence": 0.9,
  "responseMessage": "Aquí están tus contactos:"
}}

User: "Crear un nuevo contacto para Juan García"
{{
  "action": "create_ask_name",
  "confidence": 0.9,
  "contact": {{
    "firstName": "Juan",
    "lastName": "García"
  }},
  "responseMessage": "¿Qué información adicional te gustaría agregar para Juan?"
}}

User: "Actualizar el correo de Juan García a juan@example.com"
{{
  "action": "update_by_name",
  "confidence": 0.9,
  "contact": {{
    "targetFirstName": "Juan",
    "targetLastName": "García",
    "updates": {{
      "email": "juan@example.com"
    }}
  }},
  "responseMessage": "Actualizando el correo de Juan García..."
}}

Now, interpret the following user command and output a similar JSON response:
{input}

Remember:
1. The confidence should be between 0 and 1
2. If you're not sure about the command, set action to "unknown" and confidence to a low value
3. For updates, put the target contact's name in targetFirstName/targetLastName and the changes in the updates object
4. You MUST detect the language of the input and respond with responseMessage in the same language
5. ALWAYS include a responseMessage that matches the user's language`;

    this.prompt = ChatPromptTemplate.fromMessages([
      ['system', PROMPT_TEMPLATE],
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

      if (result.confidence < 0.6) {
        return {
          success: false,
          message: isSpanish(command) ?
            "No estoy muy seguro de lo que quieres hacer. ¿Podrías reformular tu solicitud?" :
            "I'm not very confident about what you want to do. Could you please rephrase your request?"
        };
      }

      switch (result.action) {
        case 'create_ask_name':
          this.pendingAction = 'waiting_for_name';
          return {
            success: true,
            message: result.responseMessage || (isSpanish(command) ? 
              "¿Cuál es el nombre del contacto que te gustaría crear?" : 
              "What is the name of the contact you'd like to create?")
          };

        case 'create_with_name':
          if (!result.contact?.firstName) {
            return {
              success: false,
              message: isSpanish(command) ? 
                "No pude entender el nombre. ¿Podrías proporcionarlo nuevamente?" :
                "I couldn't understand the name. Could you please provide it again?"
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
            message: isSpanish(command) ?
              `He creado un contacto para ${contact.firstName} ${contact.lastName}. ¿Te gustaría agregar algún detalle adicional como correo o teléfono?` :
              `I've created a contact for ${contact.firstName} ${contact.lastName}. Would you like to add any additional details like email or phone number?`,
            data: contact
          };

        case 'create':
          if (!result.contact?.firstName || !result.contact?.lastName) {
            return {
              success: false,
              message: isSpanish(command) ?
                "No pude entender los detalles del contacto. Por favor proporciona al menos un nombre y apellido." :
                "I couldn't understand the contact details. Please provide at least a first and last name."
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
            message: isSpanish(command) ?
              `Contacto creado: ${createResult.firstName} ${createResult.lastName}${
                result.contact.email ? ` con correo ${result.contact.email}` : ''}${
                result.contact.phone ? ` y teléfono ${result.contact.phone}` : ''}` :
              `Created contact: ${createResult.firstName} ${createResult.lastName}${
                result.contact.email ? ` with email ${result.contact.email}` : ''}${
                result.contact.phone ? ` and phone ${result.contact.phone}` : ''}`,
            data: createResult
          };

        case 'list':
          console.log('📋 Listing contacts');
          const contacts = await contactService.getContacts();
          console.log('Raw contacts from service:', contacts);
          const contactList = contacts
          .map(contact => `- ${contact.firstName} ${contact.lastName}${contact.email ? ` (${contact.email})` : ''}`)
          .join('\n');
          console.log('👤 Formatted contact list:', contactList);
          
          // Get the header message
          const headerMessage = result.responseMessage || (isSpanish(command) ? 
            'Aquí están tus contactos:' : 
            'Here are your contacts:');
          
          // Construct the full response message
          const responseMessage = contacts.length > 0 ? 
            `${headerMessage}\n\n${contactList}` :
            (isSpanish(command) ?
              "Aún no tienes ningún contacto." :
              "You don't have any contacts yet.");
          return {
            success: true,
            message: responseMessage,
            data: contacts
          };

        case 'delete':
          if (!result.contactId) {
            return {
              success: false,
              message: isSpanish(command) ?
                "No pude entender qué contacto eliminar. Por favor proporciona el ID del contacto." :
                "I couldn't understand which contact to delete. Please provide the contact ID."
            };
          }
          console.log('🗑️ Deleting contact:', result.contactId);
          await contactService.deleteContact(result.contactId);
          return {
            success: true,
            message: isSpanish(command) ?
              "Contacto eliminado exitosamente." :
              "Contact deleted successfully."
          };

        case 'update':
          if (!result.contactId || !result.contact) {
            return {
              success: false,
              message: isSpanish(command) ?
                "No pude entender los detalles de la actualización. Por favor proporciona el ID del contacto y qué actualizar." :
                "I couldn't understand the update details. Please provide the contact ID and what to update."
            };
          }
          console.log('✏️ Updating contact:', result.contactId, result.contact);
          const updateResult = await contactService.updateContact(result.contactId, result.contact);
          return {
            success: true,
            message: isSpanish(command) ?
              `Contacto actualizado: ${updateResult.firstName} ${updateResult.lastName}` :
              `Updated contact: ${updateResult.firstName} ${updateResult.lastName}`,
            data: updateResult
          };

        case 'update_by_name':
          if (!result.contact?.targetFirstName) {
            return {
              success: false,
              message: isSpanish(command) ?
                "No pude entender qué contacto quieres actualizar. Por favor proporciona su nombre." :
                "I couldn't understand which contact you want to update. Please provide their name."
            };
          }

          if (!result.contact.updates) {
            return {
              success: false,
              message: isSpanish(command) ?
                "No pude entender qué quieres actualizar. Por favor especifica qué información quieres cambiar." :
                "I couldn't understand what you want to update. Please specify what information you want to change."
            };
          }

          try {
            const contacts = await contactService.findByName(
              result.contact.targetFirstName,
              result.contact.targetLastName
            );

            if (contacts.length === 0) {
              return {
                success: false,
                message: isSpanish(command) ?
                  `No pude encontrar un contacto llamado ${result.contact.targetFirstName}${
                    result.contact.targetLastName ? ' ' + result.contact.targetLastName : ''
                  }` :
                  `Couldn't find a contact named ${result.contact.targetFirstName}${
                    result.contact.targetLastName ? ' ' + result.contact.targetLastName : ''
                  }`
              };
            }

            if (contacts.length > 1 && !result.contact.targetLastName) {
              const contactList = contacts
                .map(c => `${c.firstName} ${c.lastName}`)
                .join('\n');
              return {
                success: false,
                message: isSpanish(command) ?
                  `Encontré varios contactos con ese nombre. Por favor especifica el apellido también:\n${contactList}` :
                  `I found multiple contacts with that first name. Please specify the last name as well:\n${contactList}`
              };
            }

            const updatedContact = await contactService.updateContact(
              contacts[0].id,
              result.contact.updates
            );

            return {
              success: true,
              message: isSpanish(command) ?
                `Contacto actualizado: ${updatedContact.firstName} ${updatedContact.lastName}` :
                `Updated contact: ${updatedContact.firstName} ${updatedContact.lastName}`,
              data: updatedContact
            };
          } catch (error) {
            console.error('Error updating contact by name:', error);
            return {
              success: false,
              message: isSpanish(command) ?
                "Lo siento, encontré un error al actualizar el contacto." :
                "Sorry, I encountered an error while updating the contact."
            };
          }

        default:
          return {
            success: false,
            message: result.responseMessage || (isSpanish(command) ?
              "No estoy seguro de lo que quieres que haga. Puedes intentar:\n" +
              "- Crear un nuevo contacto\n" +
              "- Mostrar todos tus contactos\n" +
              "- Actualizar un contacto\n" +
              "- Eliminar un contacto" :
              "I'm not sure what you want me to do. You can try:\n" +
              "- Creating a new contact\n" +
              "- Listing all your contacts\n" +
              "- Updating a contact\n" +
              "- Deleting a contact")
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

// Add helper function to detect Spanish language
function isSpanish(text: string): boolean {
  // Common Spanish words and patterns
  const spanishPattern = /crear|nuevo|contacto|para|actualizar|cambiar|mostrar|todos|los|eliminar|borrar|nombre|correo|teléfono|número|agregar|modificar|buscar|encontrar|ver/i;
  
  return spanishPattern.test(text);
}