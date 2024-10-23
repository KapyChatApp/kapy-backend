declare module 'swagger-ui-react' {
    import { FC } from 'react';
  
    interface SwaggerUIProps {
      url?: string;
      spec?: object;
    }
  
    const SwaggerUI: FC<SwaggerUIProps>;
    export default SwaggerUI;
  }