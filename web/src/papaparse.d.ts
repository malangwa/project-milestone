declare module 'papaparse' {
  const Papa: {
    unparse(data: unknown): string;
  };

  export default Papa;
}
