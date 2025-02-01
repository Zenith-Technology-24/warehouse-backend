import { AppDataSource } from "../database/data-source";

const migrateFresh = async () => {
    try {
        let connection = await AppDataSource.initialize();
        const queryRunner = connection.createQueryRunner();

        await queryRunner.clearDatabase();
        console.log('All tables dropped');

        await queryRunner.release();
        await connection.destroy();

        connection = await AppDataSource.initialize();
        console.log('Database schema synchronized');

        await connection.destroy();
    } catch (error) {
        console.error('Error during migrate fresh:', error);
    }
};

migrateFresh()
    .then(() => console.log('Migration fresh successfully'))
    .catch((error) => console.error('Error during migrate fresh:', error));