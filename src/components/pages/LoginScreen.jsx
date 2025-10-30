import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import FormInput from '../common/FormInput';

const LoginScreen = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError('Bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
            console.error(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-800">
                    {isRegistering ? 'Yeni Hesap Oluştur' : 'Takip CRM\'e Hoş Geldiniz'}
                </h2>
                <form onSubmit={handleAuthAction} className="space-y-6">
                    <FormInput
                        label="E-posta Adresi"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <FormInput
                        label="Şifre"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
                    </button>
                    <p className="text-sm text-center text-gray-600">
                        {isRegistering ? 'Zaten bir hesabınız var mı?' : 'Hesabınız yok mu?'}
                        <button
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            className="ml-1 font-medium text-blue-600 hover:underline"
                        >
                            {isRegistering ? 'Giriş Yapın' : 'Kayıt Olun'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
