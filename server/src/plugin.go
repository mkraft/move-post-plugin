package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"regexp"

	"github.com/mattermost/mattermost-server/model"

	"github.com/mattermost/mattermost-server/plugin"
	"golang.org/x/xerrors"
)

const PluginConfigMoveOthersTemplate = "move_others_template"

type MovePostPlugin struct {
	plugin.MattermostPlugin
}

type payload struct {
	ThreadID string `json:"thread_id"`
}

type templateData struct {
	Permalink     string
	MoverUsername string
	Message       string
}

func (p *MovePostPlugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	regex := regexp.MustCompile(`/api/v1/posts/[a-z,0-9]{26}/move`)
	if !regex.Match([]byte(r.URL.Path)) || !(r.Method == http.MethodPost) {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	header := r.Header["Mattermost-User-Id"]
	if len(header) == 0 {
		p.API.LogWarn("request missing required header 'Mattermost-User-Id'")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	currentUserID := header[0]
	postID := r.URL.Path[14:40]

	defer r.Body.Close()

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		p.API.LogError(fmt.Sprintf("error decoding JSON: %s", err.Error()))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var pl payload
	err = json.Unmarshal(body, &pl)
	if err != nil {
		p.API.LogError(fmt.Sprintf("error unmarshaling json: %s", err.Error()))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if len(pl.ThreadID) != 26 {
		p.API.LogError("invalid thread id", "thread_id", pl.ThreadID)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var appErr *model.AppError
	post, appErr := p.API.GetPost(postID)
	if appErr != nil {
		p.API.LogError(fmt.Sprintf("error retrieving post: %s", appErr.Error()))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	threadPost, appErr := p.API.GetPost(pl.ThreadID)
	if appErr != nil {
		p.API.LogError(fmt.Sprintf("error retrieving thread post: %s", appErr.Error()))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if post.Type != model.POST_DEFAULT {
		p.API.LogError(fmt.Sprintf("unmovable post type %s", post.Type))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if currentUserID != post.UserId {
		err = p.hasMoveAccess(currentUserID, post)
		if err != nil {
			p.API.LogError(fmt.Sprintf("%+v", err), "user_id", currentUserID, "post_id", postID)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	}

	newPost := &model.Post{
		UserId:       post.UserId,
		ChannelId:    threadPost.ChannelId,
		RootId:       threadPost.Id,
		ParentId:     threadPost.Id,
		Message:      post.Message, // TODO: Apply template.
		Props:        post.Props,
		Hashtags:     post.Hashtags,
		FileIds:      post.FileIds,
		HasReactions: post.HasReactions,
		Metadata:     post.Metadata,
	}

	newPost, appErr = p.API.CreatePost(newPost)
	if appErr != nil {
		p.API.LogError(fmt.Sprintf("error creating new post: %s", appErr.Error()))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if currentUserID == post.UserId {
		appErr = p.API.DeletePost(post.Id)
		if appErr != nil {
			p.API.LogError(fmt.Sprintf("error deleting original post: %s", appErr.Error()))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	} else {
		currentUser, appErr := p.API.GetUser(currentUserID)
		if appErr != nil {
			p.API.LogError(fmt.Sprintf("error getting current user: %s", appErr.Error()))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		newPostChannel, appErr := p.API.GetChannel(newPost.ChannelId)
		if appErr != nil {
			p.API.LogError(fmt.Sprintf("error getting channel: %s", appErr.Error()))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		team, appErr := p.API.GetTeam(newPostChannel.TeamId)
		if appErr != nil {
			p.API.LogError(fmt.Sprintf("error getting team: %s", appErr.Error()))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		newPostURL := fmt.Sprintf("%s/%s/pl/%s", *p.API.GetConfig().ServiceSettings.SiteURL, team.Name, newPost.Id)
		post.Message, err = p.applyEditTemplate(post.Message, currentUser.Username, newPostURL)
		if err != nil {
			p.API.LogError(fmt.Sprintf("error applying temnplate: %s", appErr.Error()))
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		p.API.UpdatePost(post)
	}
}

func (p *MovePostPlugin) applyEditTemplate(postMessage, username, newPostURL string) (string, error) {
	pluginConfig := p.API.GetPluginConfig()
	configSetting := pluginConfig[PluginConfigMoveOthersTemplate]
	editTemplate := configSetting.(string)
	t := template.Must(template.New("letter").Parse(editTemplate))
	buf := new(bytes.Buffer)
	err := t.Execute(buf, templateData{Permalink: newPostURL, MoverUsername: username, Message: postMessage})
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func (p *MovePostPlugin) hasMoveAccess(userID string, post *model.Post) error {
	requiredChannelPerms := []*model.Permission{model.PERMISSION_EDIT_OTHERS_POSTS, model.PERMISSION_DELETE_OTHERS_POSTS}

	for _, perm := range requiredChannelPerms {
		if !p.API.HasPermissionToChannel(userID, post.ChannelId, perm) {
			return xerrors.Errorf("permission %v denied", perm.Id)
		}
	}

	return nil
}

func main() {
	plugin.ClientMain(&MovePostPlugin{})
}
