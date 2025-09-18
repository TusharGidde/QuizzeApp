const Footer = () => {
  return (
    <footer className="w-full mt-10 px-6 py-6 bg-gray-100 dark:bg-gray-900 text-center text-gray-600 dark:text-gray-300 stickey bottom-0 border-t shadow-inner shadow-gray-200 dark:shadow-gray-700">
      <p className="text-sm">
        © {new Date().getFullYear()} Quizze App. All rights reserved.
      </p>
      <div className="flex justify-center gap-4 mt-2 text-sm">
        <a href="/about" className="hover:underline">
          About
        </a>
        <a href="/contact" className="hover:underline">
          Contact
        </a>
        <a href="/privacy" className="hover:underline">
          Privacy Policy
        </a>
      </div>
    </footer>
  );
};

export default Footer;
