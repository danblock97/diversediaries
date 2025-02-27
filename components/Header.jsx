export default function Header() {
    return (
        <header className="w-full border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <div className="logo text-2xl font-bold">Diverse Diaries</div>
            <nav className="space-x-4">
                <a href="#" className="hover:underline">Our Story</a>
                <a href="#" className="hover:underline">Membership</a>
                <a href="#" className="hover:underline">Write</a>
                <a href="#" className="hover:underline">Sign in</a>
                <button className="bg-black text-white px-4 py-2 rounded-full ml-2">
                    Get started
                </button>
            </nav>
        </header>
    )
}
