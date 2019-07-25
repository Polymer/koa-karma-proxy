export const extractArgv = (name: string, argv: string[]) => {
  let a = 0;

  while (a < argv.length) {
    const arg = argv[a];
    if (arg === name) {
      const value = argv[a + 1];
      argv.splice(a, 2);
      return value;
    } else if (arg.startsWith(`${name}=`)) {
      const value = argv[a].split('=').slice(1).join('=');
      argv.splice(a, 1);
      return value;
    }
    ++a;
  }
  return '';
};
