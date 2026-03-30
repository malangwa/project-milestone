import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiAgentService } from './ai-agent.service';

@ApiTags('ai-agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-agent')
export class AiAgentController {
  constructor(private readonly aiAgentService: AiAgentService) {}

  @Post('platform/register')
  @ApiOperation({ summary: 'Register on the AI collaboration platform' })
  platformRegister(@Body() body: { email: string; username: string; password: string }) {
    return this.aiAgentService.platformRegister(body.email, body.username, body.password);
  }

  @Post('platform/login')
  @ApiOperation({ summary: 'Login to the AI collaboration platform' })
  platformLogin(@Body() body: { email: string; password: string }) {
    return this.aiAgentService.platformLogin(body.email, body.password);
  }

  @Get('platform/me')
  @ApiOperation({ summary: 'Get current platform user profile' })
  getMe(@Headers('x-platform-token') platformToken: string) {
    return this.aiAgentService.getMe(platformToken);
  }

  @Get('platform/projects')
  @ApiOperation({ summary: 'List projects on the AI platform' })
  listProjects(@Headers('x-platform-token') platformToken: string) {
    return this.aiAgentService.listProjects(platformToken);
  }

  @Post('platform/projects')
  @ApiOperation({ summary: 'Create a project on the AI platform' })
  createProject(
    @Headers('x-platform-token') platformToken: string,
    @Body() body: { name: string; description?: string },
  ) {
    return this.aiAgentService.createProject(platformToken, body.name, body.description);
  }

  @Post('connect')
  @ApiOperation({ summary: 'Connect/register an agent to a platform project' })
  connectAgent(
    @Headers('x-platform-token') platformToken: string,
    @Body() body: { agent_name: string; project_id: string; description?: string; expires_in_minutes?: number },
  ) {
    return this.aiAgentService.connectAgent(
      platformToken,
      body.agent_name,
      body.project_id,
      body.description,
      body.expires_in_minutes,
    );
  }

  @Get('agents')
  @ApiOperation({ summary: 'List registered agents' })
  listAgents(
    @Headers('x-platform-token') platformToken: string,
    @Query('project_id') projectId?: string,
  ) {
    return this.aiAgentService.listAgents(platformToken, projectId);
  }

  @Get('agents/online')
  @ApiOperation({ summary: 'Get online agents status' })
  onlineAgents(@Headers('x-platform-token') platformToken: string) {
    return this.aiAgentService.onlineAgents(platformToken);
  }

  @Delete('agents/:agentId')
  @ApiOperation({ summary: 'Revoke an agent' })
  revokeAgent(
    @Headers('x-platform-token') platformToken: string,
    @Param('agentId') agentId: string,
  ) {
    return this.aiAgentService.revokeAgent(platformToken, agentId);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List rooms' })
  listRooms(
    @Headers('x-platform-token') platformToken: string,
    @Query('project_id') projectId?: string,
  ) {
    return this.aiAgentService.listRooms(platformToken, projectId);
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Create a room' })
  createRoom(
    @Headers('x-platform-token') platformToken: string,
    @Body() body: { name: string; project_id: string },
  ) {
    return this.aiAgentService.createRoom(platformToken, body.name, body.project_id);
  }

  @Post('rooms/:roomId/join')
  @ApiOperation({ summary: 'Join a room' })
  joinRoom(
    @Headers('x-platform-token') platformToken: string,
    @Param('roomId') roomId: string,
  ) {
    return this.aiAgentService.joinRoom(platformToken, roomId);
  }

  @Get('rooms/:roomId/members')
  @ApiOperation({ summary: 'Get room members' })
  getRoomMembers(
    @Headers('x-platform-token') platformToken: string,
    @Param('roomId') roomId: string,
  ) {
    return this.aiAgentService.getRoomMembers(platformToken, roomId);
  }

  @Get('rooms/:roomId/online')
  @ApiOperation({ summary: 'Get online users in a room' })
  getRoomOnline(
    @Headers('x-platform-token') platformToken: string,
    @Param('roomId') roomId: string,
  ) {
    return this.aiAgentService.getRoomOnline(platformToken, roomId);
  }

  @Post('messages/send')
  @ApiOperation({ summary: 'Send a message to a room using agent token' })
  sendMessage(
    @Headers('x-agent-token') agentToken: string,
    @Body() body: { room: string; content: any; type?: string },
  ) {
    return this.aiAgentService.sendMessage(agentToken, body.room, body.content, body.type || 'info');
  }

  @Get('messages/:roomId')
  @ApiOperation({ summary: 'Get messages from a room (accepts user or agent token)' })
  getMessages(
    @Headers('x-platform-token') platformToken: string,
    @Headers('x-agent-token') agentToken: string,
    @Param('roomId') roomId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const token = agentToken || platformToken;
    return this.aiAgentService.getMessages(token, roomId, limit ?? 50, offset ?? 0);
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast a structured project event to a platform room' })
  broadcastEvent(
    @Headers('x-agent-token') agentToken: string,
    @Body() body: {
      room: string;
      event_type: string;
      project_name: string;
      data: Record<string, any>;
      triggered_by?: string;
    },
  ) {
    return this.aiAgentService.broadcastEvent(
      agentToken,
      body.room,
      body.event_type,
      body.project_name,
      body.data,
      body.triggered_by,
    );
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask the AI helper a question about the platform' })
  askAi(
    @Headers('x-platform-token') platformToken: string,
    @Body() body: { question: string },
  ) {
    return this.aiAgentService.askAi(platformToken, body.question);
  }
}
