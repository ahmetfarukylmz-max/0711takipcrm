import React, { useState, memo, FormEvent, ChangeEvent } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import FormInput from '../common/FormInput';

/**
 * LoginScreen component - Handles user authentication (login and registration)
 */
const LoginScreen = memo(() => {
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleAuthAction = async (e: FormEvent<HTMLFormElement>) => {
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

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError('');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md p-6 md:p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800">
                    {isRegistering ? 'Yeni Hesap Oluştur' : 'Takip CRM\'e Hoş Geldiniz'}
                </h2>
                <form onSubmit={handleAuthAction} className="space-y-6">
                    <FormInput
                        label="E-posta Adresi"
                        type="email"
                        inputMode="email"
                        value={email}
                        onChange={handleEmailChange}
                        required
                    />
                    <FormInput
                        label="Şifre"
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-4 py-3 min-h-[44px] text-white bg-blue-600 rounded-md hover:bg-blue-700 active:scale-[0.98] transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {isRegistering ? 'Kayıt Ol' : 'Giriş Yap'}
                    </button>
                    <p className="text-sm text-center text-gray-600">
                        {isRegistering ? 'Zaten bir hesabınız var mı?' : 'Hesabınız yok mu?'}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="ml-1 font-medium text-blue-600 hover:underline min-h-[44px] inline-flex items-center"
                        >
                            {isRegistering ? 'Giriş Yapın' : 'Kayıt Olun'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
});

LoginScreen.displayName = 'LoginScreen';

export default LoginScreen;
