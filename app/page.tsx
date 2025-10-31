import { Github, Code, Sparkles, Zap, Lock, Shield, CheckCircle2, ArrowRight, GitPullRequest, FileCode, Brain, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signIn, auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth();
  
  // Giriş yapmış kullanıcıları otomatik dashboard'a yönlendir
  if (session?.user) {
    redirect("/dashboard");
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/10 to-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}} />
      </div>

      {/* Header */}
      <header className="relative container mx-auto px-6 py-6 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-10 h-10 bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 group-hover:shadow-purple-500/70 transition-all group-hover:scale-105">
            <Code className="w-6 h-6 text-white" />
            <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600 to-blue-500 rounded-xl opacity-20 blur group-hover:opacity-40 transition-opacity" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-1.5">
              PRism AI
              <Sparkles className="w-4 h-4 text-purple-400" />
            </h1>
            <p className="text-xs text-gray-400">Smart Code Reviews</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-400 hover:text-white transition-colors">Özellikler</a>
          <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">Nasıl Çalışır</a>
        </nav>
        <a href="https://buymeacoffee.com/sametirkoren" target="_blank" rel="noopener noreferrer">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/50">
            ☕ Destek Ol
          </Button>
        </a>
      </header>

      {/* Hero Section */}
      <main className="relative container mx-auto px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
            <Sparkles className="w-4 h-4" />
            Claude Sonnet 4.5 ile Güçlendirildi
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Pull Request&apos;lerinizi{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
              Saniyeler İçinde
            </span>
            {" "}İnceleyin
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            PRism AI, GitHub pull request&apos;lerinizi otomatik olarak analiz eder, kritik hataları bulur, 
            iyileştirme önerileri sunar ve en iyi pratikleri paylaşır. Kendi Claude API anahtarınızla kullanın.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <form
              action={async () => {
                "use server"
                await signIn("github", { redirectTo: "/dashboard" })
              }}
            >
              <Button size="lg" className="text-lg px-8 py-6 h-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all">
                <Github className="mr-2 h-5 w-5" />
                GitHub ile Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>

          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Claude API anahtarı gereklidir • 2 dakikada kurulum
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20 items-stretch">
          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative p-6 h-full flex flex-col rounded-2xl border border-gray-800 bg-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Hızlı İnceleme</h3>
              <p className="text-gray-400">30 saniye içinde kapsamlı kod incelemesi. Manuel incelemelerden 10x daha hızlı.</p>
            </div>
          </div>

          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative p-6 h-full flex flex-col rounded-2xl border border-gray-800 bg-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-pink-700 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Akıllı Analiz</h3>
              <p className="text-gray-400">Backend, Frontend ve Mobile için özelleştirilmiş AI prompts ile derin analiz.</p>
            </div>
          </div>

          <div className="relative group h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative p-6 h-full flex flex-col rounded-2xl border border-gray-800 bg-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4">
                <GitPullRequest className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">GitHub Entegrasyonu</h3>
              <p className="text-gray-400">Direkt PR&apos;lara yorum ekler, etiketler ve review sonuçlarını kaydeder.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Güçlü Özellikler, <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Basit Kullanım</span>
            </h2>
            <p className="text-gray-400 text-lg">PRism AI ile kod kalitesini yükseltmenin her adımı düşünüldü</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 p-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Üç Tip Review Modu</h3>
                <p className="text-gray-400 text-sm">Backend, Frontend ve Mobile için özelleştirilmiş inceleme türleri. Her biri alanına özgü en iyi pratikleri kontrol eder.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Kritik Hata Tespiti</h3>
                <p className="text-gray-400 text-sm">Güvenlik açıkları, performans sorunları ve logic hataları anında tespit edilir ve severity ile etiketlenir.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Akıllı Öneriler</h3>
                <p className="text-gray-400 text-sm">Kod organizasyonu, performans optimizasyonları ve daha iyi pattern&apos;ler için actionable öneriler.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Best Practices</h3>
                <p className="text-gray-400 text-sm">Industry standartları, design pattern&apos;ler ve maintainability için rehberlik sağlar.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Güvenli ve Özel</h3>
                <p className="text-gray-400 text-sm">Kodunuza sadece okuma erişimi. Verileriniz şifrelenir, kodlar saklanmaz. Tamamen güvenli.</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Review Geçmişi</h3>
                <p className="text-gray-400 text-sm">Tüm incelemeleri kaydet, tekrar ziyaret et ve PR&apos;lar arasında tutarlılık sağla.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            3 Adımda <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AI Review</span>
          </h2>
          <p className="text-gray-400 text-lg mb-16">Basit, hızlı ve etkili</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-purple-500/50">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">GitHub ile Bağlan</h3>
              <p className="text-gray-400">GitHub hesabınızla giriş yapın ve Claude API anahtarınızı ayarlara ekleyin.</p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-pink-700 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-pink-500/50">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">PR Seç ve İncele</h3>
              <p className="text-gray-400">Dashboard&apos;dan PR seçin, review tipini belirleyin ve AI&apos;ın analiz etmesini bekleyin.</p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/50">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Sonuçları Gör</h3>
              <p className="text-gray-400">Detaylı feedback al, düzenle ve direkt GitHub PR&apos;a yorum olarak gönder.</p>
            </div>
          </div>

          <div className="mt-16">
            <form
              action={async () => {
                "use server"
                await signIn("github", { redirectTo: "/dashboard" })
              }}
            >
              <Button size="lg" className="text-lg px-8 py-6 h-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl shadow-purple-500/50">
                <Github className="mr-2 h-5 w-5" />
                Şimdi Başlayın
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* API Key Info */}
      <section className="relative container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Kendi API Anahtarınızı Kullanın</h3>
            <p className="text-gray-400 mb-6">PRism AI, kendi Claude API anahtarınızla çalışır. Anahtarınız güvenli bir şekilde saklanır ve sadece sizin incelemeleriniz için kullanılır. Anthropic Console&apos;dan API anahtarı alabilirsiniz.</p>
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
              <Sparkles className="w-5 h-5" />
              Claude API Anahtarı Al
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative container mx-auto px-6 py-12 border-t border-gray-800 mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold">PRism AI</p>
              <p className="text-xs text-gray-500">Smart Code Reviews</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://www.linkedin.com/in/sametirkoren" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">İletişim</a>
            <a href="https://buymeacoffee.com/sametirkoren" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              ☕ Destek Ol
            </a>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500 mt-8">
          © 2025 PRism AI. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  )
}
