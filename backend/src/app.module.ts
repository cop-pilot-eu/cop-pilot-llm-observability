import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentEventsModule } from './agent-events/agent-events.module';
import { AgentEvent } from './agent-events/entities/agent-event.entity';
import { Conversation } from './agent-events/entities/conversation.entity';
import { Judgement } from './judgements/entities/judgement.entity';
import { JudgementsModule } from './judgements/judgements.module';

@Module({
  imports: [
    AgentEventsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [AgentEvent, Conversation, Judgement],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    JudgementsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
