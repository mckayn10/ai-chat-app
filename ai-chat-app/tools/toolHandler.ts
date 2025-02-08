import { userTools } from './userTools';
import Anthropic from '@anthropic-ai/sdk';

interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface ParsedCommand {
  action: 'create' | 'list' | 'delete' | 'unknown';
  name?: string;
}

const parseCommandWithLLM = async (command: string): Promise<ParsedCommand> => {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('API Key Missing');
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const prompt = `You are a command parser that identifies user intents for a user management system.
The possible commands are:
1. Creating a user (extract the full name)
2. Listing all users
3. Deleting a user (extract the full name)

Respond in this JSON format only:
{
  "action": "create" | "list" | "delete" | "unknown",
  "name": "full name" // Only for create and delete actions
}

Examples:
"Add John Smith as a new user" -> {"action": "create", "name": "John Smith"}
"Show me all users" -> {"action": "list"}
"Remove user Jane Doe" -> {"action": "delete", "name": "Jane Doe"}
"Hello" -> {"action": "unknown"}

The user's command is: ${command}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    if (response.content && response.content[0] && 'text' in response.content[0]) {
      const result = JSON.parse(response.content[0].text);
      console.log('🤖 LLM parsed command:', result);
      return result;
    }
    
    throw new Error('Unexpected response format from AI');
  } catch (error) {
    console.error('Error parsing command with LLM:', error);
    return { action: 'unknown' };
  }
};

export const handleCommand = async (command: string): Promise<ToolResponse> => {
  console.log('🎯 Processing command:', command);
  
  try {
    const parsedCommand = await parseCommandWithLLM(command);
    
    switch (parsedCommand.action) {
      case 'create':
        if (!parsedCommand.name) {
          return {
            success: false,
            message: "I couldn't understand the name. Please provide a full name for the new user."
          };
        }
        console.log('👤 Creating user:', parsedCommand.name);
        // Split name into first and last name
        const [firstName, ...lastNameParts] = parsedCommand.name.split(' ');
        const lastName = lastNameParts.join(' ');
        // Generate a temporary email and password
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
        const tempPassword = 'Welcome123!';
        
        const createResult = await userTools.createUser(email, firstName, lastName, tempPassword);
        return {
          success: createResult.success,
          message: createResult.message || `Created user ${firstName} ${lastName} with email ${email}`,
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
        if (!parsedCommand.name) {
          return {
            success: false,
            message: "I couldn't understand which user to delete. Please provide their full name."
          };
        }
        console.log('🗑️ Deleting user:', parsedCommand.name);
        const deleteResult = await userTools.deleteUser(parsedCommand.name);
        return {
          success: deleteResult.success,
          message: deleteResult.message
        };
        
      default:
        return {
          success: false,
          message: "I'm not sure what you want me to do. You can try these commands:\n" +
                  "- Create/Add a new user (just tell me their name)\n" +
                  "- List/Show all users\n" +
                  "- Delete/Remove a user (just tell me their name)"
        };
    }
  } catch (error) {
    console.error('Error handling command:', error);
    return {
      success: false,
      message: "Sorry, I encountered an error processing your request. Please try again."
    };
  }
}; 