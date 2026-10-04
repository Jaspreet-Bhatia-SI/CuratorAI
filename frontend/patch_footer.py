import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Add import
imports = """import CookieConsent from './components/CookieConsent';
import Footer from './components/Footer';"""
content = content.replace("import CookieConsent from './components/CookieConsent';", imports)

# Insert Footer
footer_str = """        </AnimatePresence>
        <Footer />
      </main>"""
content = content.replace("        </AnimatePresence>\n      </main>", footer_str)

with open('src/App.jsx', 'w') as f:
    f.write(content)
