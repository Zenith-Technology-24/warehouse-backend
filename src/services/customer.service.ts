import { AppDataSource } from '../database/data-source';
import { Customer } from '../models/customer.entity';

export class CustomerService {
    private customerRepository = AppDataSource.getRepository(Customer);

    async getAllCustomer(): Promise<any> {
        const customers = await this.customerRepository.find()

        const customersName = customers.map((customer) => ({
            ...customer,
            id: customer.id, name: customer.first_name + ' ' + customer.last_name
        }));

        return customersName
    }

    async getCustomer(id: number): Promise<Customer | null> {
        const customer = await this.customerRepository.findOne({ where: { id } });

        if (!customer) {
            return null;
        }
        return customer;
    }

    async createCustomer(customer: Partial<Customer>): Promise<Customer> {
        const newCustomer = this.customerRepository.create(customer);
        return this.customerRepository.save(newCustomer);
    }

    async deleteCustomer(id: number): Promise<boolean> {
        const result = await this.customerRepository.delete(id);
        return result.affected !== 0;
    }

    async updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer | null> {
        const existingCustomer = await this.customerRepository.findOne({ where: { id } });

        if (!existingCustomer) {
            return null;
        }
        Object.assign(existingCustomer, customer);
        return this.customerRepository.save(existingCustomer);
    }
}
