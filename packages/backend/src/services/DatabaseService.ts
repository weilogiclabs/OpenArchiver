import { db } from '../database';

class DatabaseService {
    public db = db;
}

export default new DatabaseService();
