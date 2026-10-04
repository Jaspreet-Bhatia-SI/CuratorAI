import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Add imports
imports = """import Library from './pages/Library';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookieConsent from './components/CookieConsent';"""
content = content.replace("import Library from './pages/Library';", imports)

# Add routes
routes_old = """            <Route path="/library" element={<Library />} />
            <Route path="*" element={<NotFound />} />"""
routes_new = """            <Route path="/library" element={<Library />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<NotFound />} />"""
content = content.replace(routes_old, routes_new)

# Add CookieConsent right before FloatingPlayer
content = content.replace("<FloatingPlayer />", "<CookieConsent />\n      <FloatingPlayer />")

with open('src/App.jsx', 'w') as f:
    f.write(content)
