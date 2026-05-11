import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDateTypeToTimestampzJudgement1771412024439 implements MigrationInterface {
    name = 'UpdateDateTypeToTimestampzJudgement1771412024439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "judgements" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
