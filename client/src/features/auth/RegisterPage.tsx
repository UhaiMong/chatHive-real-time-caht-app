import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "../../shared/store/hooks";
import { register as registerAction, clearError } from "./authSlice";
import { Input } from "../../shared/components/ui/Input";
import { Button } from "../../shared/components/ui/Button";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useAppSelector((s) => s.auth);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();
  const password = watch("password");

  useEffect(() => {
    if (user) navigate("/");
    return () => {
      dispatch(clearError());
    };
  }, [user, navigate, dispatch]);

  const onSubmit = ({ username, email, password }: RegisterForm) => {
    dispatch(registerAction({ username, email, password }));
  };

  return (
    <div className="relative min-h-screen bg-surface flex items-center justify-center p-4 bg-fixed bg-center bg-cover bg-no-repeat bg-[url(chatWindowbg.jpg)]">
      {/* Overlay */}
      <div className="absolute inset-0 z-0 bg-linear-to-t from-black/80 to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="text-center mb-8 bg-black/90 py-4 rounded-2xl border-2 border-white">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4">
              <img src="chatHive_white.png" alt="Logo" />
            </div>
            <h1 className="text-2xl font-bold text-white">Join ChatHive</h1>
            <p className="text-sm text-gray-200 mt-1">Create your account</p>
          </div>
        </div>

        <div className="bg-black/90 text-gray-200 rounded-2xl p-6 border-2 border-white">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <Input
              label="Username"
              placeholder="Uhai Mong"
              leftIcon={<UserIcon className="w-4 h-4" />}
              error={errors.username?.message}
              {...register("username", {
                required: "Username is required",
                minLength: { value: 2, message: "Min 2 characters" },
                maxLength: { value: 30, message: "Max 30 characters" },
              })}
            />

            <Input
              label="Email"
              type="email"
              placeholder="uhai@gmail.com"
              leftIcon={<EnvelopeIcon className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email", {
                required: "Email is required",
                pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
              })}
            />

            <Input
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="Min 6 characters"
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
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Min 6 characters" },
              })}
            />

            <Input
              label="Confirm Password"
              type={showPass ? "text" : "password"}
              placeholder="Repeat password"
              leftIcon={<LockClosedIcon className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register("confirmPassword", {
                required: "Please confirm password",
                validate: (v) => v === password || "Passwords do not match",
              })}
            />

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              loading={status === "loading"}
              className="w-full mt-1 bg-green-600"
              size="lg"
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-100 mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold bg-white text-gray-950 p-2 underline rounded-2xl"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
