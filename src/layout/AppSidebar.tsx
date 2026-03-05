// // "use client";
// // import React, { useEffect, useRef, useState, useCallback } from "react";
// // import Link from "next/link";
// // import Image from "next/image";
// // import { usePathname } from "next/navigation";
// // import { useSidebar } from "../context/SidebarContext";
// // import {
// //   BoxCubeIcon,
// //   CalenderIcon,
// //   ChevronDownIcon,
// //   GridIcon,
// //   HorizontaLDots,
// //   ListIcon,
// //   PageIcon,
// //   PieChartIcon,
// //   PlugInIcon,
// //   TableIcon,
// //   UserCircleIcon,
// //   ShopPingCart,
// //   Users,
// //   ManageAccounts,
// // } from "../icons/index";
// // // import SidebarWidget from "./SidebarWidget";

// // type NavItem = {
// //   name: string;
// //   icon: React.ReactNode;
// //   path?: string;
// //   subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
// // };

// // const navItems: NavItem[] = [


// //   {
// //     icon: <GridIcon />,
// //     name: "Bảng Điều Khiển",
// //     path: "/dashboard",
// //   },
// //   {
// //     icon: <ManageAccounts />,
// //     name: "Accounts",
// //     path: "/accounts",
// //   },

// //   // {
// //   //   icon: <ShopPingCart />,
// //   //   name: "Codes",
// //   //   path: "/codes",
// //   // },

// //   // {
// //   //   icon: <ShopPingCart />,
// //   //   name: "Crypto Exchanges",
// //   //   path: "/crypto-exchanges",
// //   // },

// //   {
// //     icon: <PieChartIcon />, // hoặc icon khác bạn thích
// //     name: "Campaigns",
// //     path: "/campaigns",
// //   },

// //   {
// //     icon: <ListIcon />, // hoặc icon khác bạn thích
// //     name: "Order",
// //     path: "/orders",
// //   },

// //   // {
// //   //   icon: <ShopPingCart />,
// //   //   name: "Sản Phẩm",
// //   //   path: "/product",
// //   // },

// //   // {
// //   //   icon: <GridIcon />,
// //   //   name: "Danh Mục",
// //   //   path: "/category",
// //   // },

// //   {
// //     icon: <Users />,
// //     name: "Thành Viên",
// //     path: "/users",
// //   },

// //   // {
// //   //   icon: <GridIcon />,
// //   //   name: "Dashboard",
// //   //   subItems: [{ name: "Ecommerce", path: "/", pro: false }],
// //   // },
// //   // {
// //   //   icon: <CalenderIcon />,
// //   //   name: "Calendar",
// //   //   path: "/calendar",
// //   // },
// //   // {
// //   //   icon: <UserCircleIcon />,
// //   //   name: "User Profile",
// //   //   path: "/profile",
// //   // },

// //   // {
// //   //   name: "Forms",
// //   //   icon: <ListIcon />,
// //   //   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
// //   // },
// //   // {
// //   //   name: "Tables",
// //   //   icon: <TableIcon />,
// //   //   subItems: [{ name: "Basic Tables", path: "/basic-tables", pro: false }],
// //   // },
// //   // {
// //   //   name: "Pages",
// //   //   icon: <PageIcon />,
// //   //   subItems: [
// //   //     { name: "Blank Page", path: "/blank", pro: false },
// //   //     { name: "404 Error", path: "/error-404", pro: false },
// //   //   ],
// //   // },
// // ];
// // const BUILD_TAG = "SIDEBAR_V3_WITH_ACCOUNTS";
// // const othersItems: NavItem[] = [
// //   // {
// //   //   icon: <PieChartIcon />,
// //   //   name: "Charts",
// //   //   subItems: [
// //   //     { name: "Line Chart", path: "/line-chart", pro: false },
// //   //     { name: "Bar Chart", path: "/bar-chart", pro: false },
// //   //   ],
// //   // },
// //   // {
// //   //   icon: <BoxCubeIcon />,
// //   //   name: "UI Elements",
// //   //   subItems: [
// //   //     { name: "Alerts", path: "/alerts", pro: false },
// //   //     { name: "Avatar", path: "/avatars", pro: false },
// //   //     { name: "Badge", path: "/badge", pro: false },
// //   //     { name: "Buttons", path: "/buttons", pro: false },
// //   //     { name: "Images", path: "/images", pro: false },
// //   //     { name: "Videos", path: "/videos", pro: false },
// //   //   ],
// //   // },
// //   {
// //     icon: <PlugInIcon />,
// //     name: "Authentication",
// //     subItems: [
// //       { name: "Sign In", path: "/signin", pro: false },
// //       { name: "Sign Up", path: "/signup", pro: false },
// //     ],
// //   },
// // ];

// // const AppSidebar: React.FC = () => {
// //   const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
// //   const pathname = usePathname();

// //   const renderMenuItems = (
// //     navItems: NavItem[],

// //     menuType: "main" | "others"
// //   ) => (
// //     <ul className="flex flex-col gap-4">
// //       {navItems.map((nav, index) => (

// //         <li key={nav.name}>
// //           {nav.subItems ? (
// //             <button
// //               onClick={() => handleSubmenuToggle(index, menuType)}
// //               className={`menu-item group  ${openSubmenu?.type === menuType && openSubmenu?.index === index
// //                 ? "menu-item-active"
// //                 : "menu-item-inactive"
// //                 } cursor-pointer ${!isExpanded && !isHovered
// //                   ? "lg:justify-center"
// //                   : "lg:justify-start"
// //                 }`}
// //             >
// //               <span
// //                 className={` ${openSubmenu?.type === menuType && openSubmenu?.index === index
// //                   ? "menu-item-icon-active"
// //                   : "menu-item-icon-inactive"
// //                   }`}
// //               >
// //                 {nav.icon}
// //               </span>
// //               {(isExpanded || isHovered || isMobileOpen) && (
// //                 <span className={`menu-item-text`}>{nav.name}</span>
// //               )}
// //               {(isExpanded || isHovered || isMobileOpen) && (
// //                 <ChevronDownIcon
// //                   className={`ml-auto w-5 h-5 transition-transform duration-200  ${openSubmenu?.type === menuType &&
// //                     openSubmenu?.index === index
// //                     ? "rotate-180 text-brand-500"
// //                     : ""
// //                     }`}
// //                 />
// //               )}
// //             </button>
// //           ) : (
// //             nav.path && (
// //               <Link
// //                 href={nav.path}
// //                 className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
// //                   }`}
// //               >
// //                 <span
// //                   className={`${isActive(nav.path)
// //                     ? "menu-item-icon-active"
// //                     : "menu-item-icon-inactive"
// //                     }`}
// //                 >
// //                   {nav.icon}
// //                 </span>
// //                 {(isExpanded || isHovered || isMobileOpen) && (
// //                   <span className={`menu-item-text`}>{nav.name}</span>
// //                 )}
// //               </Link>
// //             )
// //           )}
// //           {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
// //             <div
// //               ref={(el) => {
// //                 subMenuRefs.current[`${menuType}-${index}`] = el;
// //               }}
// //               className="overflow-hidden transition-all duration-300"
// //               style={{
// //                 height:
// //                   openSubmenu?.type === menuType && openSubmenu?.index === index
// //                     ? `${subMenuHeight[`${menuType}-${index}`]}px`
// //                     : "0px",
// //               }}
// //             >
// //               <ul className="mt-2 space-y-1 ml-9">
// //                 {nav.subItems.map((subItem) => (
// //                   <li key={subItem.name}>
// //                     <Link
// //                       href={subItem.path}
// //                       className={`menu-dropdown-item ${isActive(subItem.path)
// //                         ? "menu-dropdown-item-active"
// //                         : "menu-dropdown-item-inactive"
// //                         }`}
// //                     >
// //                       {subItem.name}
// //                       <span className="flex items-center gap-1 ml-auto">
// //                         {subItem.new && (
// //                           <span
// //                             className={`ml-auto ${isActive(subItem.path)
// //                               ? "menu-dropdown-badge-active"
// //                               : "menu-dropdown-badge-inactive"
// //                               } menu-dropdown-badge `}
// //                           >
// //                             new
// //                           </span>
// //                         )}
// //                         {subItem.pro && (
// //                           <span
// //                             className={`ml-auto ${isActive(subItem.path)
// //                               ? "menu-dropdown-badge-active"
// //                               : "menu-dropdown-badge-inactive"
// //                               } menu-dropdown-badge `}
// //                           >
// //                             pro
// //                           </span>
// //                         )}
// //                       </span>
// //                     </Link>
// //                   </li>
// //                 ))}
// //               </ul>
// //             </div>
// //           )}
// //         </li>
// //       ))}
// //     </ul>
// //   );

// //   const [openSubmenu, setOpenSubmenu] = useState<{
// //     type: "main" | "others";
// //     index: number;
// //   } | null>(null);
// //   const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
// //     {}
// //   );
// //   const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

// //   // const isActive = (path: string) => path === pathname;
// //   // const isActive = useCallback((path: string) => path === pathname, [pathname]);
// //   const isActive = useCallback((path: string) => {
// //     if (path === "/") return pathname === "/";
// //     return pathname === path || pathname.startsWith(path + "/");
// //   }, [pathname]);

// //   useEffect(() => {
// //     // Check if the current path matches any submenu item
// //     let submenuMatched = false;
// //     ["main", "others"].forEach((menuType) => {
// //       const items = menuType === "main" ? navItems : othersItems;
// //       items.forEach((nav, index) => {
// //         if (nav.subItems) {
// //           nav.subItems.forEach((subItem) => {
// //             if (isActive(subItem.path)) {
// //               setOpenSubmenu({
// //                 type: menuType as "main" | "others",
// //                 index,
// //               });
// //               submenuMatched = true;
// //             }
// //           });
// //         }
// //       });
// //     });

// //     // If no submenu item matches, close the open submenu
// //     if (!submenuMatched) {
// //       setOpenSubmenu(null);
// //     }
// //   }, [pathname, isActive]);

// //   useEffect(() => {
// //     // Set the height of the submenu items when the submenu is opened
// //     if (openSubmenu !== null) {
// //       const key = `${openSubmenu.type}-${openSubmenu.index}`;
// //       if (subMenuRefs.current[key]) {
// //         setSubMenuHeight((prevHeights) => ({
// //           ...prevHeights,
// //           [key]: subMenuRefs.current[key]?.scrollHeight || 0,
// //         }));
// //       }
// //     }
// //   }, [openSubmenu]);

// //   const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
// //     setOpenSubmenu((prevOpenSubmenu) => {
// //       if (
// //         prevOpenSubmenu &&
// //         prevOpenSubmenu.type === menuType &&
// //         prevOpenSubmenu.index === index
// //       ) {
// //         return null;
// //       }
// //       return { type: menuType, index };
// //     });
// //   };

// //   return (
// //     <aside
// //       className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
// //         ${isExpanded || isMobileOpen
// //           ? "w-[290px]"
// //           : isHovered
// //             ? "w-[290px]"
// //             : "w-[90px]"
// //         }
// //         ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
// //         lg:translate-x-0`}
// //       onMouseEnter={() => !isExpanded && setIsHovered(true)}
// //       onMouseLeave={() => setIsHovered(false)}
// //     >
// //       <div
// //         className={`py-8 flex  ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
// //           }`}
// //       >
// //         <Link href="/dashboard">
// //           {isExpanded || isHovered || isMobileOpen ? (
// //             <>
// //               <Image
// //                 className="dark:hidden"
// //                 src="/images/logo/logo.svg"
// //                 alt="Logo"
// //                 width={150}
// //                 height={40}
// //               />
// //               <Image
// //                 className="hidden dark:block"
// //                 src="/images/logo/logo-dark.svg"
// //                 alt="Logo"
// //                 width={150}
// //                 height={40}
// //               />
// //             </>
// //           ) : (
// //             <Image
// //               src="/images/logo/logo-icon.svg"
// //               alt="Logo"
// //               width={32}
// //               height={32}
// //             />
// //           )}
// //         </Link>
// //       </div>
// //       <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
// //         <nav className="mb-6">
// //           <div className="flex flex-col gap-4">
// //             <div>
// //               <h2
// //                 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
// //                   ? "lg:justify-center"
// //                   : "justify-start"
// //                   }`}
// //               >
// //                 {isExpanded || isHovered || isMobileOpen ? (
// //                   "Menu"
// //                 ) : (
// //                   <HorizontaLDots />
// //                 )}
// //               </h2>
// //               {renderMenuItems(navItems, "main")}
// //             </div>

// //             <div className="">
// //               <h2
// //                 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
// //                   ? "lg:justify-center"
// //                   : "justify-start"
// //                   }`}
// //               >
// //                 {isExpanded || isHovered || isMobileOpen ? (
// //                   "Others"
// //                 ) : (
// //                   <HorizontaLDots />
// //                 )}
// //               </h2>
// //               {renderMenuItems(othersItems, "others")}
// //             </div>
// //           </div>
// //         </nav>
// //         {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
// //       </div>
// //       {/* <div className="mt-4 text-[10px] text-red-500">{BUILD_TAG}</div> */}
// //     </aside>

// //   );
// // };
// // <div className="mt-4 text-[10px] text-red-500">{BUILD_TAG}</div>


// // export default AppSidebar;
// "use client";

// import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { usePathname } from "next/navigation";
// import { useSidebar } from "../context/SidebarContext";
// import { useAuth } from "@/context/AuthContext";

// import {
//   ChevronDownIcon,
//   GridIcon,
//   HorizontaLDots,
//   PieChartIcon,
//   ManageAccounts,
// } from "../icons/index";

// type Role = "admin" | "user";

// type NavItem = {
//   name: string;
//   icon: React.ReactNode;
//   path?: string;
//   roles?: Role[];
//   subItems?: {
//     name: string;
//     path: string;
//     roles?: Role[];
//     pro?: boolean;
//     new?: boolean;
//   }[];
// };

// const navItems: NavItem[] = [
//   {
//     icon: <GridIcon />,
//     name: "Bảng Điều Khiển",
//     path: "/dashboard",
//   },
//   {
//     icon: <PieChartIcon />,
//     name: "Cài Đặt Lệnh",
//     path: "/campaigns",
//   },
//   {
//     icon: <ManageAccounts />,
//     name: "Cài Đặt Hệ Thống",
//     subItems: [
//       { name: "Tài Khoản Crypto", path: "/accounts" },
//       { name: "Quản Lý Thành Viên", path: "/users", roles: ["admin"] }, // ✅ chỉ admin
//     ],
//   },
// ];

// // ✅ nếu bạn không muốn render Others thì để rỗng
// const othersItems: NavItem[] = [];

// const AppSidebar: React.FC = () => {
//   const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
//   const pathname = usePathname();
//   const { me } = useAuth();

//   const role: Role = ((me?.role as Role) ?? "user");

//   const [openSubmenu, setOpenSubmenu] = useState<{
//     type: "main" | "others";
//     index: number;
//   } | null>(null);

//   const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
//     {}
//   );
//   const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

//   const isActive = useCallback(
//     (path: string) => {
//       if (path === "/") return pathname === "/";
//       return pathname === path || pathname.startsWith(path + "/");
//     },
//     [pathname]
//   );

//   // ✅ Filter items theo role (senior: memo để không tính lại nhiều)
//   const filteredNavItems = useMemo(() => {
//     const filterByRole = (items: NavItem[]) =>
//       items
//         .filter((nav) => !nav.roles || nav.roles.includes(role))
//         .map((nav) => {
//           if (!nav.subItems) return nav;
//           const subItems = nav.subItems.filter(
//             (s) => !s.roles || s.roles.includes(role)
//           );
//           return { ...nav, subItems };
//         })
//         .filter((nav) => !nav.subItems || nav.subItems.length > 0);

//     return {
//       main: filterByRole(navItems),
//       others: filterByRole(othersItems),
//     };
//   }, [role]);

//   useEffect(() => {
//     // Check if current path matches any submenu item -> auto open đúng group
//     let submenuMatched = false;

//     (["main", "others"] as const).forEach((menuType) => {
//       const items =
//         menuType === "main" ? filteredNavItems.main : filteredNavItems.others;

//       items.forEach((nav, index) => {
//         nav.subItems?.forEach((subItem) => {
//           if (isActive(subItem.path)) {
//             setOpenSubmenu({ type: menuType, index });
//             submenuMatched = true;
//           }
//         });
//       });
//     });

//     if (!submenuMatched) setOpenSubmenu(null);
//   }, [pathname, isActive, filteredNavItems]);

//   useEffect(() => {
//     if (openSubmenu !== null) {
//       const key = `${openSubmenu.type}-${openSubmenu.index}`;
//       if (subMenuRefs.current[key]) {
//         setSubMenuHeight((prev) => ({
//           ...prev,
//           [key]: subMenuRefs.current[key]?.scrollHeight || 0,
//         }));
//       }
//     }
//   }, [openSubmenu]);

//   const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
//     setOpenSubmenu((prev) => {
//       if (prev && prev.type === menuType && prev.index === index) return null;
//       return { type: menuType, index };
//     });
//   };

//   const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
//     <ul className="flex flex-col gap-4">
//       {items.map((nav, index) => (
//         <li key={`${menuType}-${nav.name}`}>
//           {nav.subItems ? (
//             <button
//               onClick={() => handleSubmenuToggle(index, menuType)}
//               className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
//                   ? "menu-item-active"
//                   : "menu-item-inactive"
//                 } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
//                 }`}
//             >
//               <span
//                 className={`${openSubmenu?.type === menuType && openSubmenu?.index === index
//                     ? "menu-item-icon-active"
//                     : "menu-item-icon-inactive"
//                   }`}
//               >
//                 {nav.icon}
//               </span>

//               {(isExpanded || isHovered || isMobileOpen) && (
//                 <span className="menu-item-text">{nav.name}</span>
//               )}

//               {(isExpanded || isHovered || isMobileOpen) && (
//                 <ChevronDownIcon
//                   className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType && openSubmenu?.index === index
//                       ? "rotate-180 text-brand-500"
//                       : ""
//                     }`}
//                 />
//               )}
//             </button>
//           ) : (
//             nav.path && (
//               <Link
//                 href={nav.path}
//                 className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
//                   }`}
//               >
//                 <span
//                   className={`${isActive(nav.path)
//                       ? "menu-item-icon-active"
//                       : "menu-item-icon-inactive"
//                     }`}
//                 >
//                   {nav.icon}
//                 </span>

//                 {(isExpanded || isHovered || isMobileOpen) && (
//                   <span className="menu-item-text">{nav.name}</span>
//                 )}
//               </Link>
//             )
//           )}

//           {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
//             <div
//               ref={(el) => {
//                 subMenuRefs.current[`${menuType}-${index}`] = el;
//               }}
//               className="overflow-hidden transition-all duration-300"
//               style={{
//                 height:
//                   openSubmenu?.type === menuType && openSubmenu?.index === index
//                     ? `${subMenuHeight[`${menuType}-${index}`]}px`
//                     : "0px",
//               }}
//             >
//               <ul className="mt-2 space-y-1 ml-9">
//                 {nav.subItems.map((subItem) => (
//                   <li key={`${menuType}-${nav.name}-${subItem.path}`}>
//                     <Link
//                       href={subItem.path}
//                       className={`menu-dropdown-item ${isActive(subItem.path)
//                           ? "menu-dropdown-item-active"
//                           : "menu-dropdown-item-inactive"
//                         }`}
//                     >
//                       {subItem.name}

//                       <span className="flex items-center gap-1 ml-auto">
//                         {subItem.new && (
//                           <span
//                             className={`ml-auto ${isActive(subItem.path)
//                                 ? "menu-dropdown-badge-active"
//                                 : "menu-dropdown-badge-inactive"
//                               } menu-dropdown-badge`}
//                           >
//                             new
//                           </span>
//                         )}
//                         {subItem.pro && (
//                           <span
//                             className={`ml-auto ${isActive(subItem.path)
//                                 ? "menu-dropdown-badge-active"
//                                 : "menu-dropdown-badge-inactive"
//                               } menu-dropdown-badge`}
//                           >
//                             pro
//                           </span>
//                         )}
//                       </span>
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//         </li>
//       ))}
//     </ul>
//   );

//   return (
//     <aside
//       className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
//         ${isExpanded || isMobileOpen
//           ? "w-[290px]"
//           : isHovered
//             ? "w-[290px]"
//             : "w-[90px]"
//         }
//         ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
//         lg:translate-x-0`}
//       onMouseEnter={() => !isExpanded && setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       <div
//         className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
//           }`}
//       >
//         <Link href="/dashboard">
//           {isExpanded || isHovered || isMobileOpen ? (
//             <>
//               <Image
//                 className="dark:hidden"
//                 src="/images/logo/logo.svg"
//                 alt="Logo"
//                 width={150}
//                 height={40}
//               />
//               <Image
//                 className="hidden dark:block"
//                 src="/images/logo/logo-dark.svg"
//                 alt="Logo"
//                 width={150}
//                 height={40}
//               />
//             </>
//           ) : (
//             <Image
//               src="/images/logo/logo-icon.svg"
//               alt="Logo"
//               width={32}
//               height={32}
//             />
//           )}
//         </Link>
//       </div>

//       <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
//         <nav className="mb-6">
//           <div className="flex flex-col gap-4">
//             <div>
//               <h2
//                 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
//                   }`}
//               >
//                 {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
//               </h2>

//               {renderMenuItems(filteredNavItems.main, "main")}
//             </div>

//             {/* Nếu muốn render others thì mở đoạn này và nhớ truyền filteredNavItems.others */}
//             {/* 
//             <div>
//               <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
//                 !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
//               }`}>
//                 {isExpanded || isHovered || isMobileOpen ? "Others" : <HorizontaLDots />}
//               </h2>
//               {renderMenuItems(filteredNavItems.others, "others")}
//             </div>
//             */}
//           </div>
//         </nav>
//       </div>
//     </aside>
//   );
// };

// export default AppSidebar;

"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  ManageAccounts,
} from "../icons/index";

type Role = "admin" | "user";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: Role[];
  subItems?: { name: string; path: string; roles?: Role[]; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Bảng Điều Khiển",
    path: "/dashboard",
  },
  {
    icon: <PieChartIcon />,
    name: "Cài Đặt Lệnh",
    path: "/campaigns",
  },
  {
    icon: <ManageAccounts />,
    name: "Cài Đặt Hệ Thống",
    subItems: [
      { name: "Tài Khoản Crypto", path: "/accounts" },
      { name: "Quản Lý Thành Viên", path: "/users", roles: ["admin"] }, // admin only
    ],
  },
];

const othersItems: NavItem[] = [];

function hasRole(required: Role[] | undefined, currentRole: Role) {
  if (!required || required.length === 0) return true;
  return required.includes(currentRole);
}

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { me, loading } = useAuth();

  // role normalize
  const role: Role = useMemo(() => {
    const r = (me?.role ?? "user").toLowerCase();
    return (r === "admin" ? "admin" : "user") as Role;
  }, [me?.role]);

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return pathname === "/";
      return pathname === path || pathname.startsWith(path + "/");
    },
    [pathname]
  );

  // ✅ filter menu theo role (đây là phần thiếu của bạn)
  const filteredNavItems = useMemo(() => {
    const filterItems = (items: NavItem[]) =>
      items
        .filter((it) => hasRole(it.roles, role))
        .map((it) => ({
          ...it,
          subItems: it.subItems?.filter((s) => hasRole(s.roles, role)),
        }))
        .filter((it) => (it.subItems ? it.subItems.length > 0 : true));

    // Nếu auth chưa load xong, vẫn render tối thiểu để không nhấp nháy.
    // (Senior thường vẫn render rồi update sau; hoặc show skeleton)
    if (loading) return filterItems(navItems);

    return filterItems(navItems);
  }, [role, loading]);

  const filteredOthersItems = useMemo(() => {
    const filterItems = (items: NavItem[]) =>
      items
        .filter((it) => hasRole(it.roles, role))
        .map((it) => ({
          ...it,
          subItems: it.subItems?.filter((s) => hasRole(s.roles, role)),
        }))
        .filter((it) => (it.subItems ? it.subItems.length > 0 : true));

    return filterItems(othersItems);
  }, [role]);

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(
    null
  );
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let submenuMatched = false;

    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? filteredNavItems : filteredOthersItems;

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as any, index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [pathname, isActive, filteredNavItems, filteredOthersItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
            >
              <span
                className={`${openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}

              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
              <Image className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>

              {renderMenuItems(filteredNavItems, "main")}
            </div>

            {/* others hidden by design */}
          </div>
        </nav>
      </div>
    </aside>
  );
}