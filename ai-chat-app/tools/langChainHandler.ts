import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { userTools } from './userTools';

// Define the schema for our command output
const CommandSchema = z.object({
  action: z.enum(['create', 'list', 'delete', 'unknown']),
  name: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

type CommandOutput = z.infer<typeof CommandSchema>;

export class UserManagementAgent {
  private model: ChatAnthropic;
  private parser: StructuredOutputParser<typeof CommandSchema>;
  private prompt: ChatPromptTemplate;

  constructor(apiKey: string) {
    this.model = new ChatAnthropic({
      anthropicApiKey: apiKey,
      modelName: 'claude-3-opus-20240229',
    });

    this.parser = StructuredOutputParser.fromZodSchema(CommandSchema);

    const formatInstructions = this.parser.getFormatInstructions().replace(/[{}]/g, (match) => `${match}${match}`);

    this.prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are a helpful assistant that manages users in a system. 
You can create users, list all users, and delete users.
${formatInstructions}

Examples:
"Add John Smith as a user" -> {{"action": "create", "name": "John Smith", "confidence": 0.9}}
"Show all users" -> {{"action": "list", "confidence": 0.95}}
"Remove Jane Doe" -> {{"action": "delete", "name": "Jane Doe", "confidence": 0.85}}
"Hello" -> {{"action": "unknown", "confidence": 0.7}}

Always try to extract the full name when relevant and set an appropriate confidence score.`],
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
        case 'create':
          if (!result.name) {
            return {
              success: false,
              message: "I couldn't understand the name. Please provide a full name for the new user."
            };
          }
          console.log('👤 Creating user:', result.name);
          const [firstName, ...lastNameParts] = result.name.split(' ');
          const lastName = lastNameParts.join(' ');
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
          const tempPassword = 'Welcome123!';
          
          const createResult = await userTools.createUser(email, firstName, lastName, tempPassword);
          return {
            success: createResult.success,
            message: createResult.message,
            data: createResult.user
          };

        case 'list':
          console.log('📋 Listing users');
          const { users } = await userTools.listUsers();
          const userList = users
            .map(user => `- ${user.email} (${user.firstName} ${user.lastName})`)
            .join('\n');
          return {
            success: true,
            message: `Here are all users:\n${userList}`,
            data: users
          };

        case 'delete':
          if (!result.name) {
            return {
              success: false,
              message: "I couldn't understand which user to delete. Please provide their full name."
            };
          }
          console.log('🗑️ Deleting user:', result.name);
          const deleteResult = await userTools.deleteUser(result.name);
          return {
            success: deleteResult.success,
            message: deleteResult.message
          };

        default:
          return {
            success: false,
            message: "I'm not sure what you want me to do. You can try:\n" +
                    "- Creating a new user (just tell me their name)\n" +
                    "- Listing all users\n" +
                    "- Deleting a user (just tell me their name)"
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