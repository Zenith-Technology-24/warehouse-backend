import { AppDataSource } from '../database/data-source';
import { Role } from '../models/role.entity';
import { User } from '../models/user.entity';

const seedSuperAdmin = async () => {
    await AppDataSource.initialize();

    const userRepository = AppDataSource.getRepository(User);

    // Check if SuperAdmin already exists
    const superAdmin = await userRepository.findOneBy({ email: 'superadmin@wisce.com' });
    const admin = await userRepository.findOneBy({ email: 'admin@wisce.com' });
    
    if (!superAdmin && !admin) {
        const superAdminRole = await AppDataSource.getRepository(Role).findOneBy({ name: 'superadmin' });
        const adminRole = await AppDataSource.getRepository(Role).findOneBy({name: 'admin'});
        
        const newSuperAdmin = userRepository.create({
            firstname: 'Aldrin',
            lastname: 'Richard',
            email: 'superadmin@wisce.com',
            password: 'p4ssw0rd0123',
            roles: superAdminRole ? [superAdminRole] : []
        });

        const newAdmin = userRepository.create({
            firstname: 'Glenn',
            lastname: 'Pacturan',
            email: 'admin@wisce.com',
            password: 'p4ssw0rd0123',
            roles: adminRole ? [adminRole] : []
        });

        await userRepository.save(newSuperAdmin);
        console.log('SuperAdmin user created successfully!');

        await userRepository.save(newAdmin);
        console.log('Admin user created successfully!');
    } else {
        console.log('SuperAdmin user already exists.');
    }

    await AppDataSource.destroy();
};

seedSuperAdmin().catch((error) => console.log(error));
