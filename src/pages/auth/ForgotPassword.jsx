import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import StoreLogo from "../../components/common/StoreLogo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-app flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-8">
          <StoreLogo size="lg" />
        </div>
        <h1 className="text-3xl font-black text-text tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-muted">We'll send a reset link if the account exists.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          {submitted ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="mx-auto text-brand" size={32} />
              <p className="text-sm text-muted">
                If an account exists for {email}, a reset link is on its way.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-muted">Email address</label>
                <div className="relative mt-1">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full border border-border rounded-lg py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-brand hover:bg-brand-hover">
                Send reset link
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm font-medium text-muted">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
