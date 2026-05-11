import { MigrationInterface, QueryRunner } from "typeorm";

export class CorrectJudgementColumnName1771315972740 implements MigrationInterface {
    name = 'CorrectJudgementColumnName1771315972740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" RENAME COLUMN "halucination" TO "hallucination"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" RENAME COLUMN "hallucination" TO "halucination"`);
    }

}
