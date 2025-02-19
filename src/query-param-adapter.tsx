import { useLocation, useNavigate } from 'react-router';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdapterAny = any;

export function ReactRouterAdapter({ children }: AdapterAny) {
  const navigate = useNavigate();

  return children({
    location: useLocation(),
    push: (location: AdapterAny) =>
      navigate({ search: location.search }, { state: location.state }),
    replace: (location: AdapterAny) =>
      navigate(
        { search: location.search },
        { replace: true, state: location.state }
      ),
  });
}
