import React, { useState } from "react";
import Input from "../../components/input/input";
import Button from "../../components/Button/Button";
import { useNavigate } from "react-router-dom";

const Form = ({ isSignInPage = false }) => {
  const navigate = useNavigate();
  const base_url = "http://localhost:8000";

  const [data, setData] = useState({
    ...(!isSignInPage && {
      fullName: "",
    }),
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    console.log("data", data);
    e.preventDefault();
    const response = await fetch(
      `${base_url}/api/${isSignInPage ? "login" : "register"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    if (response.status === 400) {
      alert("Invalid Credentials!");
    } else {
      const resData = await response.json();
      if (resData.token) {
        localStorage.setItem("user:token", resData.token);
        localStorage.setItem("user:detail", JSON.stringify(resData.user));
        navigate("/");
      }
    }
  };
  return (
    <div className="bg-blue-50 h-screen flex justify-center items-center">
      <div className="bg-white w-[600px] h-[700px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-3xl sm:text-4xl font-extrabold">
          Welcome {isSignInPage && "Back"}{" "}
        </div>
        <div className="text-xl font-light mb-14">
          {isSignInPage ? "Sign in to explore" : "Sign up now to get started"}{" "}
        </div>
        <form
          className="w-full flex flex-col items-center"
          onSubmit={handleSubmit}
        >
          {!isSignInPage && (
            <Input
              label="Full Name"
              name="name"
              placeholder="Enter Your Full Name"
              mainClassName="w-2/3 sm:w-1/2"
              className="mb-6"
              required
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
          )}
          <Input
            label="Email"
            name="Email"
            placeholder="Enter Your Email"
            mainClassName="w-2/3 sm:w-1/2"
            className="mb-6"
            required
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            name="Password"
            type="password"
            placeholder="Enter Your Password"
            mainClassName="w-2/3 sm:w-1/2"
            className="mb-14"
            required
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <Button
            label={isSignInPage ? "Sign in" : "Sign up"}
            className="w-2/3 sm:w-1/2 mb-4"
          />
        </form>
        <div>
          {isSignInPage
            ? "Didn't have an account "
            : "Already have an account? "}
          <span
            className="text-blue-400 cursor-pointer underline"
            onClick={() => navigate(`/${isSignInPage ? "signup" : "signin"}`)}
          >
            {isSignInPage ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Form;
