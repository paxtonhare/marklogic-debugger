import { MarklogicDebuggerPage } from './app.po';

describe('marklogic-debugger App', function() {
  let page: MarklogicDebuggerPage;

  beforeEach(() => {
    page = new MarklogicDebuggerPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
