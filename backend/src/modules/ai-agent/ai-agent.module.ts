import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentService } from './ai-agent.service';
import { AgentClient } from './agent-client';

@Module({
  imports: [HttpModule],
  controllers: [AiAgentController],
  providers: [AiAgentService, AgentClient],
  exports: [AiAgentService, AgentClient],
})
export class AiAgentModule {}
