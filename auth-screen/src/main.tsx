import { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function AuthScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "microsoft">("email");
  const [ssoLoading, setSsoLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("licenceflow-theme");
    return savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(value => {
      const nextTheme = !value;
      localStorage.setItem("licenceflow-theme", nextTheme ? "dark" : "light");
      return nextTheme;
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthMethod("email");
    setSubmitted(true);
  };

  const continueWithMicrosoft = () => {
    setSubmitted(false);
    setSsoLoading(true);
    window.setTimeout(() => {
      setAuthMethod("microsoft");
      setSubmitted(true);
      setSsoLoading(false);
    }, 700);
  };

  return (
    <main className={`auth-page ${darkMode ? "dark" : ""}`}>
      <section className="auth-shell" aria-label="LicenceFlow giriş ekranı">
        <div className="auth-form-side">
          <div className="auth-topbar">
            <a className="brand" href="#" aria-label="LicenceFlow ana sayfa">
              <span className="brand-mark" aria-hidden><i/><i/></span>
              <span><strong>LicenceFlow</strong><small>mehmet</small></span>
            </a>
            <button className={`theme-switch ${darkMode ? "is-dark" : "is-light"}`} type="button" aria-label={darkMode ? "Açık temaya geç" : "Koyu temaya geç"} aria-pressed={darkMode} title={darkMode ? "Açık temaya geç" : "Koyu temaya geç"} onClick={toggleTheme}>
              <span className="theme-symbol" aria-hidden>{darkMode ? "☾" : "☼"}</span>
              <span className="theme-knob" aria-hidden/>
            </button>
          </div>

          <div className="form-wrap">
            <div className="form-heading">
              <span className="eyebrow">GÜVENLİ ERİŞİM</span>
              <h1>Tekrar hoş geldin</h1>
              <p>Lisans portföyünü yönetmek için hesabına giriş yap.</p>
            </div>

            {submitted && (
              <div className="success-message" role="status">
                <span>✓</span>
                <div><strong>{authMethod === "microsoft" ? "Microsoft ile demo giriş başarılı" : "Demo giriş başarılı"}</strong><small>Bu ekran dashboard’a bağlı değildir.</small></div>
              </div>
            )}

            <form onSubmit={submit}>
              <label>
                <span>E-posta adresi</span>
                <div className="input-shell">
                  <i aria-hidden>@</i>
                  <input type="email" required placeholder="ornek@sirket.com" autoComplete="email" />
                </div>
              </label>

              <label>
                <span>Şifre</span>
                <div className="input-shell">
                  <i aria-hidden>●</i>
                  <input type={showPassword ? "text" : "password"} required minLength={6} placeholder="En az 6 karakter" autoComplete="current-password" />
                  <button type="button" className="show-password" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}>
                    {showPassword ? "Gizle" : "Göster"}
                  </button>
                </div>
              </label>

              <div className="form-options">
                <label className="remember"><input type="checkbox" defaultChecked /><span>Beni hatırla</span></label>
                <button type="button" className="text-button">Şifremi unuttum</button>
              </div>

              <button className="submit-button" type="submit">Giriş yap <span>→</span></button>
            </form>

            <div className="divider"><span>veya kurumsal hesabınla</span></div>

            <button className="sso-button" type="button" onClick={continueWithMicrosoft} disabled={ssoLoading}>
              {ssoLoading ? <span className="button-spinner" aria-hidden/> : <span className="microsoft-mark" aria-hidden><i/><i/><i/><i/></span>}
              {ssoLoading ? "Microsoft hesabı açılıyor..." : "Microsoft ile devam et"}
            </button>

            <p className="privacy">Devam ederek kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.</p>
          </div>
        </div>

        <aside className="auth-visual">
          <div className="visual-glow one"/>
          <div className="visual-glow two"/>
          <div className="visual-copy">
            <span className="visual-label"><i/> Lisans kontrol merkezi</span>
            <h2>Yenilemeleri, maliyetleri ve sorumlulukları tek bir yerde takip edin.</h2>
          </div>

          <div className="preview-card">
            <div className="preview-head">
              <div><small>YAKLAŞAN YENİLEMELER</small><strong>3 işlem bekliyor</strong></div>
              <span>21 Ağu</span>
            </div>
            <div className="renewal-list">
              <article><span className="license-icon">M</span><div><strong>Microsoft 365</strong><small>25 gün kaldı</small></div><b>$26.400</b></article>
              <article><span className="license-icon figma">F</span><div><strong>Figma Organization</strong><small>7 gün kaldı</small></div><b>$5.400</b></article>
              <article><span className="license-icon slack">S</span><div><strong>Slack Business+</strong><small className="expired">11 gün geçti</small></div><b>$9.600</b></article>
            </div>
            <div className="preview-summary">
              <div><small>AKTİF</small><strong>2</strong></div>
              <div><small>YAKLAŞAN</small><strong>2</strong></div>
              <div><small>SÜRESİ DOLAN</small><strong>1</strong></div>
            </div>
          </div>

          <div className="trust-row"><span>✓ Güvenli erişim</span><span>✓ Merkezi takip</span><span>✓ Otomatik hesaplama</span></div>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<AuthScreen />);
