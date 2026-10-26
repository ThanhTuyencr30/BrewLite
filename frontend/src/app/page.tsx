import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5EC]">
      <h1 className="text-3xl font-bold text-[#333] mb-8">Trang chủ BrewLite</h1>
      <Link 
        href="/cart" 
        className="bg-[#C28E5E] text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-[#B08054] transition-colors shadow-lg"
      >
        Đi tới Giỏ Hàng
      </Link>
    </div>
  );
}