import { AppDataSource } from '../database/data-source';
import { Role } from '../models/role.entity';
import { User } from '../models/user.entity';

const seedRoles = async () => {
    await AppDataSource.initialize();

    const roleRepository = AppDataSource.getRepository(Role);

    const superAdminRole = roleRepository.create({
        name: 'superadmin',
        description: "Can do almost anything",
    });

    const adminRole = roleRepository.create({
        name: 'admin',
        description: "tagnaa daw",
    });


    await roleRepository.save(superAdminRole);
    await roleRepository.save(adminRole);

    await AppDataSource.destroy();
};

seedRoles().catch((error) => console.log(error));
