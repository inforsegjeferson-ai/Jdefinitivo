import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Sun, LogIn, UserPlus, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

const MAX_ATTEMPTS = 5;
const BASE_COOLDOWN_SECONDS = 30;

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Rate limiting state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (!cooldownEndTime) {
      setCooldownRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((cooldownEndTime - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      
      if (remaining <= 0) {
        setCooldownEndTime(null);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [cooldownEndTime]);

  useEffect(() => {
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate('/');
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Centralized auth error handling - avoids exposing internal error details
  const getAuthErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials')) {
      return 'Email ou senha incorretos';
    }
    if (message.includes('email not confirmed')) {
      return 'Por favor, confirme seu email antes de fazer login';
    }
    if (message.includes('already registered')) {
      return 'Este email já está cadastrado';
    }
    if (message.includes('too many requests') || message.includes('rate limit')) {
      return 'Muitas tentativas. Tente novamente em alguns minutos';
    }
    if (message.includes('weak password') || message.includes('password')) {
      return 'A senha não atende aos requisitos de segurança';
    }
    
    // Generic fallback - don't expose internal error details
    console.error('Auth error:', error);
    return 'Erro de autenticação. Tente novamente mais tarde';
  };

  // Password validation with stronger requirements
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'A senha deve conter pelo menos uma letra maiúscula' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'A senha deve conter pelo menos uma letra minúscula' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'A senha deve conter pelo menos um número' };
    }
    return { valid: true, message: '' };
  };

  const isRateLimited = useCallback(() => {
    return cooldownRemaining > 0;
  }, [cooldownRemaining]);

  const handleFailedAttempt = useCallback(() => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    
    if (newAttempts >= MAX_ATTEMPTS) {
      // Exponential backoff: 30s, 60s, 120s, etc.
      const multiplier = Math.pow(2, Math.floor((newAttempts - MAX_ATTEMPTS) / 2));
      const cooldownMs = BASE_COOLDOWN_SECONDS * multiplier * 1000;
      setCooldownEndTime(Date.now() + cooldownMs);
      toast.error(`Muitas tentativas. Aguarde ${BASE_COOLDOWN_SECONDS * multiplier} segundos.`);
    }
  }, [failedAttempts]);

  const handleSuccessfulLogin = useCallback(() => {
    setFailedAttempts(0);
    setCooldownEndTime(null);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRateLimited()) {
      toast.error(`Aguarde ${cooldownRemaining} segundos antes de tentar novamente`);
      return;
    }
    
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      handleFailedAttempt();
      toast.error(getAuthErrorMessage(error));
    } else {
      handleSuccessfulLogin();
      toast.success('Login realizado com sucesso!');
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !name) {
      toast.error('Preencha todos os campos');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name: name,
        }
      }
    });

    if (error) {
      toast.error(getAuthErrorMessage(error));
    } else {
      toast.success('Conta criada com sucesso!');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-solar mb-4">
            <Sun className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">SolarTech</h1>
          <p className="text-muted-foreground">Gestão de Serviços</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesse sua conta</CardTitle>
            <CardDescription>
              Entre com suas credenciais ou crie uma nova conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Rate limit warning */}
                  {isRateLimited() && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                      <div className="flex items-center gap-2 text-destructive mb-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Aguarde {cooldownRemaining}s para tentar novamente
                        </span>
                      </div>
                      <Progress 
                        value={100 - (cooldownRemaining / BASE_COOLDOWN_SECONDS) * 100} 
                        className="h-1.5"
                      />
                    </motion.div>
                  )}
                  
                  {/* Attempt warning */}
                  {failedAttempts > 0 && failedAttempts < MAX_ATTEMPTS && !isRateLimited() && (
                    <p className="text-xs text-muted-foreground text-center">
                      Tentativas restantes: {MAX_ATTEMPTS - failedAttempts}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || isRateLimited()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || isRateLimited()}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-solar" 
                    disabled={loading || isRateLimited()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : isRateLimited() ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Aguarde {cooldownRemaining}s
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Mínimo 8 caracteres, maiúscula, minúscula e número"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-solar" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Conta
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Sistema de gestão de serviços para energia solar
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
