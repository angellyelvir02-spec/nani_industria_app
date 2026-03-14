// /app/context/UserContext.tsx
import React, { createContext, useState, ReactNode } from "react";

type UserType = "client" | "babysitter" | null;

interface UserContextProps {
  isLoggedIn: boolean;
  userType: UserType;
  selectedBabysitterId: number | null;
  loginClient: () => void;
  loginBabysitter: () => void;
  logout: () => void;
  selectBabysitter: (id: number) => void;
}

export const UserContext = createContext<UserContextProps>({} as UserContextProps);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [selectedBabysitterId, setSelectedBabysitterId] = useState<number | null>(null);

  const loginClient = () => {
    setIsLoggedIn(true);
    setUserType("client");
  };

  const loginBabysitter = () => {
    setIsLoggedIn(true);
    setUserType("babysitter");
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserType(null);
    setSelectedBabysitterId(null);
  };

  const selectBabysitter = (id: number) => {
    setSelectedBabysitterId(id);
  };

  return (
    <UserContext.Provider value={{
      isLoggedIn,
      userType,
      selectedBabysitterId,
      loginClient,
      loginBabysitter,
      logout,
      selectBabysitter
    }}>
      {children}
    </UserContext.Provider>
  );
};