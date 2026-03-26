import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { login, clearError } from "./authSlice";
import { Input } from "../../shared/components/ui/Input";
import { Button } from "../../shared/components/ui/Button";

interface LoginForm {
  email: string;
  password: string;
}

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useAppSelector((s) => s.auth);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  useEffect(() => {
    if (user) navigate("/");
    return () => {
      dispatch(clearError());
    };
  }, [user, navigate, dispatch]);

  const onSubmit = (data: LoginForm) => {
    dispatch(login(data));
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 bg-fixed bg-center bg-cover bg-no-repeat bg-[url(bg_.png)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
            <img src="chatHive_white.png" alt="Logo" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-gray-100 mt-1">Sign in to ChatHive</p>
        </div>

        <div className="bg-surface-secondary rounded-2xl p-6 border border-white/30">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <Input
              className="placeholder:text-gray-500"
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<EnvelopeIcon className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
              })}
            />

            <Input
              className="placeholder:text-gray-500"
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<LockClosedIcon className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                >
                  {showPass ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register("password", { required: "Password is required" })}
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              loading={status === "loading"}
              className="w-full mt-1"
              size="lg"
            >
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-100 mt-5">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-gray-200 hover:text-primary-300 font-bold transition-colors"
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
