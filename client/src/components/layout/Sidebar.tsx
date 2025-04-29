import { Link, useLocation } from "wouter";
import { User, Settings, HelpCircle, Bot, Home, GitBranch, Puzzle, Link2, Braces, TestTube, Code, Library, Wand2, Bug } from "lucide-react";

export interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const [location] = useLocation();

  // Define navigation items
  const workspaceItems = [
    { path: "/", icon: Home, label: "Builder" },
    { path: "/settings", icon: Settings, label: "Settings" }
  ];

  const libraryItems = [
    { path: "/agents", icon: Bot, label: "Agents" },
    { path: "/workflows", icon: GitBranch, label: "Workflows" },
    { path: "/nodes", icon: Puzzle, label: "Nodes" }
  ];
  
  const advancedItems = [
    { path: "/workflow-test", icon: TestTube, label: "Test Bench" },
    { path: "/api-registry", icon: Code, label: "API Registry" },
    { path: "/node-debug", icon: Bug, label: "Node Debug Panel" }
  ];

  // Helper function to render navigation items
  const renderNavItems = (items: Array<{ path: string; icon: React.ElementType; label: string }>) => {
    return items.map((item, index) => {
      const IconComponent = item.icon;
      return (
        <Link key={index} href={item.path}>
          <div className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${location === item.path ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <div className={`flex items-center ${collapsed ? "w-full justify-center" : ""}`}>
              <IconComponent className={`${collapsed ? "h-9 w-9" : "h-5 w-5"}`} />
            </div>
            {!collapsed && <span>{item.label}</span>}
          </div>
        </Link>
      );
    });
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-slate-900 text-white transition-all duration-300`}>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className={`${collapsed ? "w-10 h-10" : "w-8 h-8"} rounded-md bg-primary flex items-center justify-center`}>
              <Bot className={`${collapsed ? "h-9 w-9" : "h-5 w-5"}`} />
            </div>
            {!collapsed && <h1 className="font-bold text-xl">Agent Builder</h1>}
          </div>
        </div>
        
        <nav className="space-y-6 flex-grow">
          <div>
            <div className={`flex items-center text-sm text-slate-400 font-medium mb-2 px-3 ${collapsed ? 'hidden' : 'flex'}`}>
              <span>WORKSPACE</span>
            </div>
            <div className="space-y-1">
              {renderNavItems(workspaceItems)}
            </div>
          </div>
          
          <div>
            <div className={`flex items-center text-sm text-slate-400 font-medium mb-2 px-3 ${collapsed ? 'hidden' : 'flex'}`}>
              <span>LIBRARY</span>
            </div>
            <div className="space-y-1">
              {renderNavItems(libraryItems)}
            </div>
          </div>
          
          <div>
            <div className={`flex items-center text-sm text-slate-400 font-medium mb-2 px-3 ${collapsed ? 'hidden' : 'flex'}`}>
              <span>ADVANCED</span>
            </div>
            <div className="space-y-1">
              {renderNavItems(advancedItems)}
            </div>
          </div>
        </nav>
        
        <div className="mt-auto">
          <Link href="/help">
            <div className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${location === '/help' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
              <div className={`flex items-center ${collapsed ? "w-full justify-center" : ""}`}>
                <HelpCircle className={`${collapsed ? "h-9 w-9" : "h-5 w-5"}`} />
              </div>
              {!collapsed && <span>Help & Resources</span>}
            </div>
          </Link>
          <div className="flex items-center space-x-3 px-3 py-2 mt-2">
            <div className={`${collapsed ? "w-10 h-10" : "w-8 h-8"} rounded-full bg-slate-700 flex items-center justify-center text-white`}>
              <User className={`${collapsed ? "h-9 w-9" : "h-5 w-5"}`} />
            </div>
            {!collapsed && (
              <div className="text-sm">
                <div className="font-medium">John Smith</div>
                <div className="text-slate-400 text-xs">john@example.com</div>
              </div>
            )}
          </div>
          {/* User profile section */}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;