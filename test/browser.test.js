describe('Proxying a test file with import statements', () => {
  it('should rewrite the specifier to relative path', async () => {
    const response = await fetch('/base/karma.proxy.js')
    expect(response.text.slice(0, 7)).toEqual('/* :) */');
  });
});
