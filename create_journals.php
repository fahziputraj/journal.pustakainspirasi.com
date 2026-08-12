<?php
/**
 * Script to clean up serialized OJS settings for Pustaka Inspirasi Minang journals.
 * Uses OJS ContextService to properly save localized values.
 */

define('INDEX_FILE_LOCATION', dirname(__FILE__) . '/index.php');
require(dirname(__FILE__) . '/tools/bootstrap.php');

use APP\core\Application;

if (php_sapi_name() !== 'cli') {
    die("Must be run via CLI.\n");
}

// 1. Retrieve the Site Administrator user
$adminUser = \APP\facades\Repo::user()->getByUsername('pimadmin');
if (!$adminUser) {
    die("ERROR: Administrator user 'pimadmin' not found!\n");
}

// 2. Set the administrator user in the Registry to authorize creations
\Registry::set('user', $adminUser);

// 3. Resolve OJS Context Service
$contextService = app('context');
if (!$contextService) {
    die("ERROR: Context service not found.\n");
}

$request = Application::get()->getRequest();
$router = new \APP\core\PageRouter();
$router->setApplication(Application::get());
$request->setRouter($router);

$contextDao = Application::getContextDAO();

// 4. Define the correct journal settings
$journalsData = [
    [
        'path' => 'mbj',
        'acronym' => 'MBJ',
        'name' => 'Minang Bioscience Journal (MBJ)',
        'tagline' => 'Exploring Biodiversity, Inspiring Innovation',
        'description' => 'Minang Bioscience Journal (MBJ) is an international, peer-reviewed, open-access scholarly journal dedicated to advancing knowledge and innovation across the broad field of biological sciences. Published by Pustaka Inspirasi Minang, MBJ serves as a global platform for researchers, academics, practitioners, and policymakers to disseminate high-quality scientific findings that contribute to the understanding, conservation, and sustainable utilization of biological resources.<br><br>The journal particularly welcomes studies addressing biological diversity, ecosystem sustainability, biotechnology innovation, environmental challenges, and emerging biological technologies relevant to both tropical and global contexts. By promoting rigorous scientific inquiry and interdisciplinary collaboration, MBJ aims to support evidence-based solutions for contemporary biological and environmental issues.',
    ],
    [
        'path' => 'mcj',
        'acronym' => 'MCJ',
        'name' => 'Minang Chemistry Journal (MCJ)',
        'tagline' => 'Advancing Chemical Science for a Sustainable Future',
        'description' => 'Minang Chemistry Journal (MCJ) is an international, peer-reviewed, open-access journal dedicated to publishing high-quality research and scholarly contributions in all areas of chemistry and its interdisciplinary applications. Published by Pustaka Inspirasi Minang, the journal serves as a global platform for researchers, scientists, academics, and industry professionals to disseminate innovative findings that advance chemical sciences and contribute to sustainable development.<br><br>The journal promotes scientific excellence through rigorous peer review and encourages the publication of original research that addresses contemporary challenges in chemistry, materials science, environmental sustainability, industrial innovation, and emerging chemical technologies. MCJ welcomes contributions from researchers worldwide and aims to foster international collaboration in chemical research and education.',
    ],
    [
        'path' => 'mcsj',
        'acronym' => 'MCSJ',
        'name' => 'Minang Computer Science Journal (MCSJ)',
        'tagline' => 'Innovate • Compute • Transform',
        'description' => 'Minang Computer Science Journal (MCSJ) is an international, peer-reviewed, open-access journal dedicated to advancing knowledge, innovation, and technological development in computer science and related interdisciplinary fields. Published by Pustaka Inspirasi Minang, the journal serves as a global platform for researchers, academics, practitioners, industry professionals, and policymakers to disseminate high-quality scientific contributions that address emerging challenges and opportunities in the digital era.<br><br>The journal publishes original research articles, review papers, short communications, technical reports, and innovative case studies that contribute to theoretical advancement, practical implementation, and technological innovation across the broad spectrum of computer science.',
    ],
    [
        'path' => 'mmj',
        'acronym' => 'MMJ',
        'name' => 'Minang Mathematics Journal (MMJ)',
        'tagline' => 'Unlocking Patterns, Solving Problems, Shaping the Future',
        'description' => 'Minang Mathematics Journal (MMJ) is an international, peer-reviewed, open-access journal dedicated to the advancement of mathematical sciences through the publication of high-quality research, theoretical developments, innovative methodologies, and interdisciplinary applications. Published by Pustaka Inspirasi Minang, the journal serves as a global platform for researchers, academics, educators, statisticians, data scientists, and practitioners to disseminate significant contributions that expand the frontiers of mathematics and its applications.<br><br>The journal welcomes original research articles, review articles, short communications, and methodological papers that contribute to the development of pure mathematics, applied mathematics, statistics, mathematical modeling, computational mathematics, and emerging interdisciplinary mathematical sciences.',
    ],
    [
        'path' => 'mpj',
        'acronym' => 'MPJ',
        'name' => 'Minang Physics Journal (MPJ)',
        'tagline' => 'Exploring the Fundamentals, Inspiring the Future',
        'description' => 'Minang Physics Journal (MPJ) is an international, peer-reviewed, open-access journal dedicated to the publication of high-quality research and scholarly contributions in all fields of physics and its interdisciplinary applications. Published by Pustaka Inspirasi Minang, the journal provides a global platform for scientists, researchers, academics, engineers, and practitioners to disseminate innovative discoveries that advance fundamental understanding and technological development in physical sciences.<br><br>The journal promotes scientific excellence by publishing original research articles, review articles, short communications, and methodological studies that contribute to theoretical advancements, experimental discoveries, computational modeling, and practical applications of physics.',
    ],
];

foreach ($journalsData as $data) {
    echo "Processing Journal: {$data['name']}...\n";
    $journal = $contextDao->getByPath($data['path']);
    if ($journal) {
        // Clear out existing incorrect setting arrays first to avoid merge corruption
        $contextDao->update("DELETE FROM journal_settings WHERE journal_id = ? AND setting_name IN ('name', 'acronym', 'description', 'publisherInstitution', 'searchDescription')", [$journal->getId()]);
        
        // Reload journal to make sure it starts clean
        $journal = $contextDao->getByPath($data['path']);

        $updatedJournal = $contextService->edit($journal, [
            'name' => ['en' => $data['name']],
            'acronym' => ['en' => $data['acronym']],
            'description' => ['en' => $data['description']],
            'publisherInstitution' => 'Pustaka Inspirasi Minang',
            'searchDescription' => ['en' => $data['tagline']],
            'themePluginPath' => 'pustakaMinang',
        ], $request);

        if ($updatedJournal) {
            echo "SUCCESS: Corrected settings for {$data['path']}.\n";
        } else {
            echo "ERROR: Failed to update {$data['path']}.\n";
        }
    } else {
        echo "ERROR: Journal with path {$data['path']} not found.\n";
    }
}

echo "All tasks completed.\n";
