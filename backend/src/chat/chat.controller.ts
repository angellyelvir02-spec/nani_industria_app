import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(SupabaseGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Req() req: any) {
    const authUserId = req.user?.id || req.user?.sub;
    return this.chatService.getConversations(authUserId);
  }

  @Get('with/:otherUserId')
  async getConversation(
    @Param('otherUserId') otherUserId: string,
    @Req() req: any,
  ) {
    const authUserId = req.user?.id || req.user?.sub;
    return this.chatService.getConversationWithUser(authUserId, otherUserId);
  }

  @Post('with/:otherUserId')
  async sendMessage(
    @Param('otherUserId') otherUserId: string,
    @Body() body: { mensaje?: string },
    @Req() req: any,
  ) {
    const authUserId = req.user?.id || req.user?.sub;
    return this.chatService.sendMessage(authUserId, otherUserId, body?.mensaje);
  }
}
