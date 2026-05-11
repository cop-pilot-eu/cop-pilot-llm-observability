import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Judgement } from './entities/judgement.entity';
import { JudgementsController } from './judgements.controller';
import { JudgementsService } from './judgements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Judgement]), HttpModule],
  controllers: [JudgementsController],
  providers: [JudgementsService],
  exports: [JudgementsService],
})
export class JudgementsModule {}
