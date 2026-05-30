import 'dotenv/config';
import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from './user.schema';

(async () => {
    await mongoose.connect(process.env.MONGO_URI!);
    const User = mongoose.model('User', UserSchema);

    const username = 'admin';
    const passwordHash = await bcrypt.hash('Admin123*', 10);

    await User.updateOne(
        { username },
        {
            name: 'Administrador',
            username,
            passwordHash,
            role: 'admin',
            active: true
        },
        { upsert: true }
    );

    console.log('Seed OK: admin / Admin123*');
    await mongoose.disconnect();
})();