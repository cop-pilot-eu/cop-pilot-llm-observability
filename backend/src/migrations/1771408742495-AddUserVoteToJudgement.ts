import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserVoteToJudgement1771408742495 implements MigrationInterface {
    name = 'AddUserVoteToJudgement1771408742495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" ADD "user_vote" boolean`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "judgements" DROP COLUMN "user_vote"`);
    }

}
