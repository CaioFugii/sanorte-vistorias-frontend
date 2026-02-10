import { createContext, useContext, ReactNode } from 'react';
import { IAppRepository } from '@/data/repositories/IAppRepository';
import MockAppRepository from '@/data/repositories/MockAppRepository';
// import ApiAppRepository from '@/data/repositories/ApiAppRepository';

const repository = new MockAppRepository();
// Para trocar para API no futuro, descomente a linha acima e comente a linha abaixo:
// const repository = new ApiAppRepository();

const RepositoryContext = createContext<IAppRepository>(repository);

export const useRepository = () => useContext(RepositoryContext);

interface RepositoryProviderProps {
  children: ReactNode;
}

export const RepositoryProvider = ({ children }: RepositoryProviderProps) => {
  return (
    <RepositoryContext.Provider value={repository}>
      {children}
    </RepositoryContext.Provider>
  );
};
