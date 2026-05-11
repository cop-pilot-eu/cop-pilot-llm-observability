import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770986941256 implements MigrationInterface {
    name = 'InitialSchema1770986941256'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "agent_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "agent_id" character varying NOT NULL, "event_type" character varying NOT NULL, "model" character varying NOT NULL, "provider" character varying NOT NULL, "input_tokens" integer NOT NULL, "completion_tokens" integer NOT NULL, "max_tokens" integer NOT NULL, "latency_ms" integer NOT NULL, "success" boolean NOT NULL, "input_prompt" text NOT NULL, "response_text" text NOT NULL, "reasoning_steps" jsonb, "mcp_tool_selected" character varying, "tool_selection_reasoning" text, "tool_selection_confidence" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94c713565641b3cfac600e14e94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cfd4c67ca0ed529f8fd7cd91bc" ON "agent_events" ("agent_id") `);
        await queryRunner.query(`CREATE TABLE "judgements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "agent_event_id" uuid NOT NULL, "response" jsonb, "judge_output" text, "accuracy" integer, "relevance" integer, "reasoning_quality" integer, "halucination" boolean, "judge_reasoning" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_56ff1b412e6e06b996300f6b0cf" UNIQUE ("agent_event_id"), CONSTRAINT "REL_56ff1b412e6e06b996300f6b0c" UNIQUE ("agent_event_id"), CONSTRAINT "PK_7ba5a452e0f781f85794caac188" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_56ff1b412e6e06b996300f6b0c" ON "judgements" ("agent_event_id") `);
        await queryRunner.query(`ALTER TABLE "judgements" ADD CONSTRAINT "FK_56ff1b412e6e06b996300f6b0cf" FOREIGN KEY ("agent_event_id") REFERENCES "agent_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP CONSTRAINT "FK_56ff1b412e6e06b996300f6b0cf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_56ff1b412e6e06b996300f6b0c"`);
        await queryRunner.query(`DROP TABLE "judgements"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfd4c67ca0ed529f8fd7cd91bc"`);
        await queryRunner.query(`DROP TABLE "agent_events"`);
    }

}
