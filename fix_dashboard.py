import re

filepath = r'c:\Projects\Sun Glade\Loan\frontend\app\staff\dashboard\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the corrupted block by line numbers 287-291 pattern
old_block = (
    "        coApplicant: {\n"
    "            { id: 'staff', label: 'Staff Members', value: staffMembers, icon: 'badge', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', tag: 'O_ADMIN' },\n"
    "            { id: 'admin', label: 'Admins', value: admins || '\u2014', icon: 'admin_panel_settings', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tag: 'ADMIN' },\n"
    "        ];\n"
    "    })() : [];"
)

new_block = (
    "        coApplicant: {\n"
    '            name: "", mobile: "", email: "", relation: "", occupation: "", aadhar: "", pan: "",\n'
    '            employmentType: "", monthlyIncome: "",\n'
    "            isSameAsFather: false, isSameAsMother: false\n"
    "        }\n"
    "    });\n"
    "    const [createLoading, setCreateLoading] = useState(false);\n"
    "\n"
    "    // Document state\n"
    "    const [userDocuments, setUserDocuments] = useState<any[]>([]);\n"
    "    const [docsLoading, setDocsLoading] = useState(false);\n"
    "    const [uploadingDocs, setUploadingDocs] = useState<{ [key: string]: number }>({});\n"
    "    const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});\n"
    "    const [s3Documents, setS3Documents] = useState<any[]>([]);\n"
    "    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});\n"
    "\n"
    "    const loadOverview = useCallback(async () => {\n"
    "        setLoading(true);\n"
    "        try {\n"
    "            const [blogStats, appStats, userStats]: [any, any, any] = await Promise.all([\n"
    "                adminApi.getBlogStats().catch(() => ({ data: {} })),\n"
    "                adminApi.getApplicationStats().catch(() => ({ data: {} })),\n"
    "                adminApi.getUsers().catch(() => ({ data: [], total: 0 }))\n"
    "            ]);\n"
    "            setStats({\n"
    "                blogs: blogStats.data || {},\n"
    "                apps: appStats.data || {},\n"
    "                users: { total: userStats.total || userStats.data?.length || 0 }\n"
    "            });\n"
    "        } catch (e) {\n"
    "            console.error(e);\n"
    "        } finally {\n"
    "            setLoading(false);\n"
    "        }\n"
    "    }, []);\n"
    "\n"
    "    const loadData = useCallback(async () => {\n"
    '        if (activeSection === "overview" || activeSection.startsWith("chat_")) return;\n'
    "        setLoading(true);\n"
    "        setData([]);\n"
    "        try {\n"
    "            let res: any;\n"
    '            if (activeSection === "blogs") {\n'
    "                res = await adminApi.getBlogs({ limit: '100' });\n"
    "                setData(Array.isArray(res) ? res : (res.data || []));\n"
    '            } else if (activeSection === "applications") {\n'
    "                const params: any = {};\n"
    '                if (filterStatus !== "all") params.status = filterStatus;\n'
    "                res = await adminApi.getApplications(params);\n"
    "                setData(Array.isArray(res) ? res : (res.data || []));\n"
    '            } else if (activeSection === "community") {\n'
    "                res = await adminApi.getForumPosts(50);\n"
    "                setData(Array.isArray(res) ? res : (res.data || []));\n"
    '            } else if (activeSection === "users") {\n'
    "                const offset = (currentPage - 1) * itemsPerPage;\n"
    "                const [usersRes, statsRes]: [any, any] = await Promise.all([\n"
    "                    adminApi.getUsers(itemsPerPage, offset, searchQuery, userRoleFilter),\n"
    "                    adminApi.getUserStats().catch(() => null)\n"
    "                ]);\n"
    "                if (usersRes && usersRes.data) {\n"
    "                    setData(usersRes.data);\n"
    "                    setTotalItems(usersRes.total || usersRes.data.length);\n"
    "                } else {\n"
    "                    setData(Array.isArray(usersRes) ? usersRes : []);\n"
    "                    setTotalItems(Array.isArray(usersRes) ? usersRes.length : 0);\n"
    "                }\n"
    "                if (statsRes && statsRes.success) {\n"
    "                    setUserSectionStats(statsRes.data || statsRes);\n"
    "                } else if (statsRes) {\n"
    "                    setUserSectionStats(statsRes);\n"
    "                }\n"
    "            }\n"
    "        } catch (e) {\n"
    "            console.error(e);\n"
    "        } finally {\n"
    "            setLoading(false);\n"
    "        }\n"
    "    }, [activeSection, filterStatus, currentPage, itemsPerPage, searchQuery, userRoleFilter]);\n"
    "\n"
    "    useEffect(() => {\n"
    "        setCurrentPage(1);\n"
    "    }, [activeSection, filterStatus, searchQuery, userRoleFilter]);\n"
    "\n"
    "    useEffect(() => {\n"
    '        if (activeSection === "overview") loadOverview();\n'
    "        else loadData();\n"
    "    }, [activeSection, loadOverview, loadData]);\n"
    "\n"
    "    // Pre-calculate stats for different sections to avoid complex IIFEs in JSX\n"
    "    const userStatsData = activeSection === 'users' ? (() => {\n"
    "        const total = userSectionStats?.total ?? totalItems;\n"
    "        const students = userSectionStats?.student ?? 0;\n"
    "        const bankPartners = userSectionStats?.bank ?? 0;\n"
    "        const staffMembers = userSectionStats?.staff ?? 0;\n"
    "        const admins = userSectionStats?.admin ?? 0;\n"
    "        return [\n"
    "            { id: 'all', label: 'Total Users', value: total, icon: 'group', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tag: 'ACTIVE' },\n"
    "            { id: 'student', label: 'Student Accounts', value: students, icon: 'school', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tag: 'ROLE' },\n"
    "            { id: 'bank', label: 'Bank Partners', value: bankPartners, icon: 'account_balance', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tag: 'ROLE' },\n"
    "            { id: 'staff', label: 'Staff Members', value: staffMembers, icon: 'badge', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', tag: 'O_ADMIN' },\n"
    "            { id: 'admin', label: 'Admins', value: admins || '\u2014', icon: 'admin_panel_settings', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tag: 'ADMIN' },\n"
    "        ];\n"
    "    })() : [];"
)

if old_block in content:
    content = content.replace(old_block, new_block, 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: Block replaced.')
else:
    print('ERROR: Old block not found. Searching for partial match...')
    lines = content.splitlines()
    for i, line in enumerate(lines[284:295], start=285):
        print(f'  L{i}: {repr(line)}')
