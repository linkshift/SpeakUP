<?
declare(strict_types=1);

error_reporting(0);
session_name("speakup_session");
@session_start();
require('../default/scripts/engine/config.php');
require('../default/scripts/engine/functions.php');

$version = "1.8.12.1";
# define("DEBUG", 1);

class CodeGen {
	public $stylesheet = '';
	public $javascript = '';
	public $iconsTouch = '';
	public $iconsFav = '';
	public $compiledHead = '';

	private $sizes;
	private $files;
	private $staticPath;

	private function listIcons(string $rel, string $path, string $prefix, array $sizesArray) : string {
		$str = "\n";
		foreach ($sizesArray as $size) {
			$str .= "<link rel='{$rel}' sizes='{$size}x{$size}' href='{$path}/{$prefix}-{$size}x{$size}.png'>\n";
		}
		return $str;
	}

	private function fillUp() : bool {
		$this->stylesheet = "\n";
		$this->javascript = "\n";

		foreach ($this->files as $file){
			$fileType = $file[0];
			$filePath = 'resources/' . $file[1];
			$fileName = $this->staticPath . '/apps/speakup/' . $file[1];
			$fileVer = filemtime($filePath);
			if ($fileType == 'css'){
				$this->stylesheet .= "<link rel='stylesheet' href='{$fileName}?_v={$fileVer}' />\n";
			} else if ($file[0] == 'js'){
				$this->javascript .= "<script src='{$fileName}?_v={$fileVer}'></script>\n";
			}
		}
		
		return true;
	}

	public function __construct(string $static, array $files) {
		$this->sizes = new stdClass();
		$this->sizes->touch = array(180, 152, 144, 120, 114, 76, 72, 60, 57, 48);
		$this->sizes->fav = array(16, 32, 48, 64, 96, 128);

		$this->files = $files;
		$this->staticPath = $static;

		$this->fillUp();
		$this->iconsTouch = $this->listIcons('apple-touch-icon', $this->staticPath . '/apps/speakup/images/icons', 'apple-touch-icon', $this->sizes->touch);
		$this->iconsFav = $this->listIcons('icon', $this->staticPath . '/apps/speakup/images/icons', 'favicon', $this->sizes->fav);
		
		$this->compiledHead = $this->iconsTouch . $this->iconsFav . $this->stylesheet;
	}
}

class Templater {
	private static function getTemplate(string $name) {
		if (file_exists(__DIR__ . "/resources/templates/{$name}.html")) {
			return file_get_contents(__DIR__ . "/resources/templates/{$name}.html");
		} else {
			return false;
		}
	}
	
	private static function performReplace(string $page, array $replaceFrom, array $replaceTo, bool $internal = false) : string {
		$countReplaced = array(
			'static' => 0,
			'svg' => 0,
			'template' => 0
		);
		$newPage = $page;
		$newPage = str_replace($replaceFrom, $replaceTo, $newPage, $countReplaced['static']);
		
		$newPage = preg_replace("#%svg:(icon-([a-zA-Z0-9\-]*)([a-zA-Z0-9\-\s]*))%#", "<svg class='icon $1'><use xlink:href='/resources/fonts/symbol-defs.svg#icon-$2'></use></svg>", $newPage, -1, $countReplaced['svg']);
		
		if (!$internal) {
			$newPage = preg_replace_callback("#%template:([a-zA-Z0-9\-_]*)%#", function(array $m) {
				$tpl = self::getTemplate($m[1]);
				return ($tpl !== FALSE) ? $tpl : 'Template is not found';
			}, $newPage, -1, $countReplaced['template']);
		}

		$sum = $countReplaced['static'] + $countReplaced['svg'] + $countReplaced['template'];
		if ($sum != 0) {
			$newPage = self::performReplace($newPage, $replaceFrom, $replaceTo, true);
		}
		return $newPage;
	}
	
	public static function apply(string $template, array $replaceFrom, array $replaceTo) : string {
		$tmpl = self::getTemplate($template);
		if (!$tmpl) {
			return 'Template is not found';
		}
		
		return self::performReplace($tmpl, $replaceFrom, $replaceTo);
	}
}

if (defined("DEBUG") || isset($_REQUEST['debug'])) {
	$files = array(
		array('css', 'styles/app.css'),
		array('js',  'scripts/socket.io.js'),
		array('js',  'scripts/swrtc-latest-v2.min.js'),
		array('js',  'scripts/tooltip.min.js'), // http://darsa.in/tooltip/
		array('js',  'scripts/screenfull.min.js'), // https://github.com/sindresorhus/screenfull.js
		array('js',  'scripts/svg4everybody.min.js'), // https://github.com/jonathantneal/svg4everybody
		array('js',  'scripts/app.js'),
		array('js',  'scripts/friends.js')
	);
} else {
	$files = array(
		array('css', 'styles/app.css'),
		array('js',  'scripts/compiled.js')
	);
}

if (isset($_SESSION['lcp_auth_user']['login'])) {
	$forcedLogin = $_SESSION['lcp_auth_user']['login'];
	$sessionData = sprintf(
		"var _session = { id: '%s', guid: '%s', login: '%s' };",
		$_SESSION['lcp_auth_user']['id'],
		$_SESSION['lcp_auth_user']['guid'],
		$_SESSION['lcp_auth_user']['login']
	);
	
} else {
	$forcedLogin = '';
	$sessionData = "var _session = { id: false, guid: false, login: false };";
}

if (isset($_COOKIE['link_auth']) && !isset($_SESSION['lcp_auth_user'])) {
	header("Location: https://ptdev.pw/scripts/speakup.php");
	exit;
}

$code = new CodeGen($static, $files);

trackStat("SpeakUP", $version, "start");

$location = (isset($_SERVER['REQUEST_URI'])) ? $_SERVER['REQUEST_URI'] : '/';
if (preg_match("#/(call|room)/([a-zA-Z0-9\-_]{2,})#", $location)) {
	$templateId = 'index';
} else {
	$templateId = 'index';
}

$page = Templater::apply(
	$templateId,
	array("%static%", "%head%", "%version%", "%body%", "%session%"),
	array($static, $code->compiledHead, $version, $code->javascript, $sessionData)
);

echo $page;
?>