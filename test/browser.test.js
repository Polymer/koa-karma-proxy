describe('Proxying a test file with import statements', () => {
  it('should rewrite the specifier to relative path', async () => {
    const response = await fetch('/base/karma.proxy.js');
    const text = await response.text();
    expect(text.slice(0, 8)).toEqual('/* :) */');
  });
});
